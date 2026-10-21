import './site.css';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import { Marked } from 'marked';
import * as needle from '@needle';
import { examples, IExample } from './examples';
import apiData from './api.json';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);

const REPO = 'https://github.com/morganstanley/needle';

/* ---------- content ---------- */

const rawDocs = import.meta.glob('../../docs/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const docs = new Map<string, string>();
for (const [path, text] of Object.entries(rawDocs)) {
    docs.set(path.split('/').pop()!.replace(/\.md$/, ''), text);
}

interface INavGroup { title: string; items: Array<{ slug: string; title: string }> }
const guideNav: INavGroup[] = [
    { title: 'Core', items: [
        { slug: 'tokens', title: 'Tokens' }, { slug: 'strategies', title: 'Strategies' }, { slug: 'factories', title: 'Factories' },
        { slug: 'lazy-and-optional', title: 'Lazy and optional' }, { slug: 'instances-and-values', title: 'Instances and values' },
        { slug: 'external-resolution', title: 'External resolution' } ] },
    { title: 'Runtime', items: [
        { slug: 'caching', title: 'Caching' }, { slug: 'scopes', title: 'Scopes' }, { slug: 'interception', title: 'Interception' },
        { slug: 'metrics', title: 'Metrics' }, { slug: 'configuration', title: 'Configuration' }, { slug: 'errors-and-logging', title: 'Errors and logging' } ] },
    { title: 'More', items: [
        { slug: 'registered-types', title: 'Registered types' }, { slug: 'semantic-injection', title: 'Semantic injection' },
        { slug: 'angular', title: 'Angular' }, { slug: 'feature-support', title: 'Feature support' }, { slug: 'troubleshooting', title: 'Troubleshooting' },
        { slug: 'contributing', title: 'Contributing and benchmarks' } ] },
];

/* ---------- helpers ---------- */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '\x26amp;', '<': '\x26lt;', '>': '\x26gt;', '"': '\x26quot;' })[c]!);
const slugify = (s: string) => s.toLowerCase().replace(/[^\w\- ]/g, '').trim().replace(/ /g, '-');
const highlight = (code: string, lang?: string) =>
    lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : esc(code);

const marked = new Marked({
    renderer: {
        code({ text, lang }) {
            return `<pre><button class="copy" type="button">Copy</button><code class="hljs">${highlight(text, lang || undefined)}</code></pre>`;
        },
        heading({ tokens, depth, text: rawText }) {
            const text = this.parser.parseInline(tokens);
            // Build the id from the raw heading text rather than rendered HTML, so no tag stripping is needed.
            const id = slugify(rawText);
            return `<h${depth} id="${id}">${text}<a class="anchor" href="#" data-anchor="${id}" aria-label="Link to this section">#</a></h${depth}>`;
        },
        link({ href, tokens }) {
            const text = this.parser.parseInline(tokens);
            const doc = /^([\w-]+)\.md(?:#([\w-]+))?$/.exec(href);
            if (doc) {
                const slug = doc[1] === 'getting-started' ? 'start' : `guide/${doc[1]}`;
                return `<a href="#/${slug}${doc[2] ? '/' + doc[2] : ''}">${text}</a>`;
            }
            const ex = /^\.\.\/examples\/([\w-]+\.ts)$/.exec(href);
            if (ex) return `<a href="${REPO}/blob/main/examples/${ex[1]}">${text}</a>`;
            const ext = /^https?:/.test(href);
            return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
        },
    },
});

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const page = $('#page');
const side = $('#side');

function sideHtml(active: string): string {
    const link = (href: string, title: string) => `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${title}</a>`;
    return [
        '<h4>Start</h4>', link('#/start', 'Get started'),
        ...guideNav.flatMap((g) => [`<h4>${g.title}</h4>`, ...g.items.map((i) => link(`#/guide/${i.slug}`, i.title))]),
        '<h4>Try it</h4>', ...examples.map((e) => link(`#/examples/${e.id}`, e.title)),
        '<h4>Reference</h4>', link('#/theming', 'Theming'), link('#/api', 'API reference'),
    ].join('');
}

function scrollToAnchor(anchor?: string) {
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
    else window.scrollTo(0, 0);
}

/* ---------- live editor ---------- */

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...a: unknown[]) => Promise<void>;

function liveEditor(ex: IExample): HTMLElement {
    const el = document.createElement('div');
    el.className = 'live';
    el.innerHTML = `<div class="bar"><button class="run" type="button">▶ Run</button><button class="reset" type="button">Reset</button>
      <span class="grow">${esc(ex.title)} — edit the code and run it. Runs the real library in your browser.</span></div>
      <div class="panes"><textarea spellcheck="false" aria-label="Example code">${esc(ex.code)}</textarea><pre class="out" aria-live="polite"></pre></div>`;
    const area = el.querySelector('textarea')!;
    const out = el.querySelector<HTMLElement>('.out')!;
    const run = async () => {
        out.innerHTML = '';
        const print = (...args: unknown[]) => {
            const line = document.createElement('div');
            line.textContent = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
            out.appendChild(line);
        };
        try {
            await new AsyncFunction('needle', 'log', area.value)(needle, print);
            if (!out.childElementCount) out.innerHTML = '<span class="t">(no output)</span>';
        } catch (e) {
            const err = document.createElement('div');
            err.className = 'err';
            err.textContent = `${(e as Error).name}: ${(e as Error).message}`;
            out.appendChild(err);
        }
    };
    el.querySelector('.run')!.addEventListener('click', run);
    el.querySelector('.reset')!.addEventListener('click', () => { area.value = ex.code; out.innerHTML = ''; });
    area.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') { e.preventDefault(); area.setRangeText('  ', area.selectionStart, area.selectionEnd, 'end'); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    });
    queueMicrotask(run);
    return el;
}

/* ---------- pages ---------- */

function home() {
    page.innerHTML = `<section class="hero">
      <h1>Dependency injection that stays out of your way.</h1>
      <p class="lead">Needle is a small, lightweight DI container for Angular, React, Node and plain JavaScript. Decorators or a plain API, scoped injectors, caching strategies, interception and semantic-version-aware injection.</p>
      <div class="cta"><a class="primary" href="#/start">Get started</a><a class="secondary" href="#/examples/basics">Live examples</a><a class="secondary" href="#/api">API reference</a></div>
      <span class="install"><code>npm install @morgan-stanley/needle reflect-metadata</code><button type="button" data-copy="npm install @morgan-stanley/needle reflect-metadata">Copy</button></span>
    </section>
    <h2>Try it right here</h2><div id="home-live"></div>
    <h2>What you get</h2>
    <div class="grid">
      ${[
          ['Decorators or API', 'Use @Injectable and @Inject, or register everything with the Injector API.', '#/guide/tokens'],
          ['Scoped injectors', 'Child scopes with overrides, lookup and destroy hooks.', '#/guide/scopes'],
          ['Caching strategies', 'Persistent, no-cache, weak, idle and conditional.', '#/guide/caching'],
          ['Interception', 'Run code before and after construction.', '#/guide/interception'],
          ['Lazy, factory, optional', 'Defer, parameterise or tolerate missing dependencies.', '#/guide/lazy-and-optional'],
          ['Typed errors', 'Stable codes and the resolution path in every failure.', '#/guide/errors-and-logging'],
          ['Metrics', 'Resolution counts, creation cost and dependency counts.', '#/guide/metrics'],
          ['Semantic injection', 'Each consumer gets the version it was built against.', '#/guide/semantic-injection'],
      ].map(([t, d, h]) => `<a class="card" href="${h}"><b>${t}</b><span>${d}</span></a>`).join('')}
    </div>
    <h2>Quick start</h2>${marked.parse('```typescript\nimport \'reflect-metadata\'; // first import in your app\nimport { getRootInjector, Injectable } from \'@morgan-stanley/needle\';\n\n@Injectable()\nclass Engine {}\n\n@Injectable()\nclass Car {\n    constructor(public engine: Engine) {}\n}\n\nconst car = getRootInjector().get(Car);\n```')}`;
    $('#home-live').appendChild(liveEditor(examples[0]));
}

function renderDoc(slug: string, anchor?: string) {
    const md = docs.get(slug);
    if (!md) return notFound();
    page.innerHTML = marked.parse(md) as string;
    scrollToAnchor(anchor);
}

function guide(slug: string, anchor?: string) {
    renderDoc(slug, anchor);
}

function examplePage(id: string) {
    const ex = examples.find((e) => e.id === id) ?? examples[0];
    page.innerHTML = `<h1>${esc(ex.title)}</h1><p class="lead">${esc(ex.summary)}</p>
      <p>These examples use the registration API with explicit metadata so they run in the browser without a build step. The same things work with decorators in your own code (see <a href="#/start">Get started</a>).</p>`;
    page.appendChild(liveEditor(ex));
    const idx = examples.indexOf(ex);
    const nav = document.createElement('p');
    nav.innerHTML = [idx > 0 ? `<a href="#/examples/${esc(examples[idx - 1].id)}">← ${esc(examples[idx - 1].title)}</a>` : '', idx < examples.length - 1 ? `<a style="float:right" href="#/examples/${esc(examples[idx + 1].id)}">${esc(examples[idx + 1].title)} →</a>` : ''].join(' ');
    page.appendChild(nav);
    window.scrollTo(0, 0);
}

/* theming */
interface ITheme { dark?: boolean; accent?: string; radius?: number }
const sanitizeTheme = (raw: unknown): ITheme => {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const t: ITheme = {};
    if (typeof r.dark === 'boolean') t.dark = r.dark;
    if (typeof r.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(r.accent)) t.accent = r.accent;
    if (typeof r.radius === 'number' && Number.isFinite(r.radius)) t.radius = Math.min(24, Math.max(0, r.radius));
    return t;
};
const loadTheme = (): ITheme => { try { return sanitizeTheme(JSON.parse(localStorage.getItem('needle-theme') || '{}')); } catch { return {}; } };
const applyTheme = (t: ITheme) => {
    const root = document.documentElement;
    root.classList.toggle('dark', !!t.dark);
    if (t.accent) root.style.setProperty('--accent', t.accent); else root.style.removeProperty('--accent');
    if (t.radius != null) root.style.setProperty('--radius', t.radius + 'px'); else root.style.removeProperty('--radius');
    localStorage.setItem('needle-theme', JSON.stringify(t));
};

function theming() {
    const t = loadTheme();
    const swatches = ['#0d9488', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];
    page.innerHTML = `<h1>Theming</h1><p class="lead">This site is themed with a handful of CSS custom properties. Change them here and the whole site (including the live editors) updates. Your choice is remembered in this browser.</p>
      <div class="theme-grid"><div>
        <label>Accent <input id="t-accent" type="color" value="#0d9488" /></label>
        <div class="swatches">${swatches.map((c) => `<button type="button" data-c="${esc(c)}" aria-label="Accent ${esc(c)}"></button>`).join('')}</div>
        <label>Corner radius <input id="t-radius" type="range" min="0" max="24" value="12" /></label>
        <label>Dark mode <input id="t-dark" type="checkbox" /></label>
        <button type="button" class="ghost-btn" id="t-reset">Reset to defaults</button>
      </div><div>
        <div class="card"><b>Preview card</b><span>Cards, buttons and code blocks follow the same variables.</span></div>
        <p><a class="ghost-btn" style="background:var(--accent);color:#fff;border-color:var(--accent)" href="#/theming">Primary button</a></p>
        <h3>CSS variables</h3><pre><code id="t-css" class="hljs"></code></pre>
      </div></div>`;
    ($('#t-accent') as HTMLInputElement).value = t.accent ?? '#0d9488';
    ($('#t-radius') as HTMLInputElement).value = String(t.radius ?? 12);
    ($('#t-dark') as HTMLInputElement).checked = document.documentElement.classList.contains('dark');
    page.querySelectorAll<HTMLButtonElement>('.swatches button').forEach((b) => { b.style.background = b.dataset.c!; });
    const read = (): ITheme => ({
        dark: ($('#t-dark') as HTMLInputElement).checked,
        accent: ($('#t-accent') as HTMLInputElement).value,
        radius: +($('#t-radius') as HTMLInputElement).value,
    });
    const refresh = () => {
        const v = read();
        applyTheme(v);
        $('#t-css').textContent = `:root {\n  --accent: ${v.accent};\n  --radius: ${v.radius}px;\n}\n${v.dark ? ':root.dark { /* dark palette active */ }' : ''}`;
    };
    page.querySelectorAll('input').forEach((i) => i.addEventListener('input', refresh));
    page.querySelectorAll<HTMLButtonElement>('.swatches button').forEach((b) => b.addEventListener('click', () => { ($('#t-accent') as HTMLInputElement).value = b.dataset.c!; refresh(); }));
    $('#t-reset').addEventListener('click', () => { localStorage.removeItem('needle-theme'); applyTheme({}); theming(); });
    $('#t-css').textContent = `:root {\n  --accent: ${t.accent ?? '#0d9488'};\n  --radius: ${t.radius ?? 12}px;\n}`;
    window.scrollTo(0, 0);
}

/* api */
interface IApiMember { name: string; kind: string; signature: string; doc: string; static?: boolean }
interface IApiItem { name: string; kind: string; doc: string; file: string; deprecated: boolean; signature?: string; members?: IApiMember[] }
const api = apiData as IApiItem[];

function apiPage(focus?: string) {
    page.innerHTML = `<h1>API reference</h1><p class="lead">Generated from the library's public exports (${api.length} symbols). Source of truth is <code>main/index.ts</code>.</p>
      <input class="search" id="api-q" type="search" placeholder="Filter by name, e.g. register, Injector, cache…" aria-label="Filter API" />
      <div id="api-list"></div>`;
    const list = $('#api-list');
    const draw = (q: string) => {
        const needleQ = q.trim().toLowerCase();
        const shown = api.filter((i) => !needleQ || i.name.toLowerCase().includes(needleQ) || i.members?.some((m) => m.name.toLowerCase().includes(needleQ)));
        list.innerHTML = shown.map((i) => `<section class="api-item" id="api-${esc(i.name)}">
          <h3><span class="kind">${esc(i.kind)}</span>${esc(i.name)}${i.deprecated ? ' <small>(deprecated)</small>' : ''}</h3>
          <div class="src">${esc(i.file)}</div>
          ${i.doc ? `<p>${esc(i.doc)}</p>` : ''}
          ${i.signature ? `<pre class="sig"><code class="hljs">${highlight(i.signature, 'typescript')}</code></pre>` : ''}
          ${i.members?.length ? `<details ${needleQ || focus === i.name ? 'open' : ''}><summary>${i.members.length} members</summary>${i.members
              .filter((m) => !needleQ || m.name.toLowerCase().includes(needleQ) || i.name.toLowerCase().includes(needleQ))
              .map((m) => `<div class="member"><pre><code class="hljs">${highlight((m.static ? 'static ' : '') + m.signature, 'typescript')}</code></pre>${m.doc ? `<p>${esc(m.doc)}</p>` : ''}</div>`).join('')}</details>` : ''}
        </section>`).join('') || '<p>No matches.</p>';
    };
    $<HTMLInputElement>('#api-q').addEventListener('input', (e) => draw((e.target as HTMLInputElement).value));
    draw('');
    if (focus) document.getElementById(`api-${focus}`)?.scrollIntoView(); else window.scrollTo(0, 0);
}

function notFound() {
    page.innerHTML = '<h1>Not found</h1><p>That page does not exist. <a href="#/">Back home</a>.</p>';
}

/* ---------- router ---------- */

function route() {
    const hash = location.hash.replace(/^#/, '') || '/';
    const [, section = '', a = '', b] = hash.split('/');
    side.classList.remove('open');
    let active = `#/${section}${a ? '/' + a : ''}`;
    if (section === '') { home(); active = ''; }
    else if (section === 'start') { renderDoc('getting-started', a || undefined); active = '#/start'; }
    else if (section === 'guide') { guide(a, b); active = `#/guide/${a}`; }
    else if (section === 'examples') { examplePage(a); active = `#/examples/${a}`; }
    else if (section === 'theming') theming();
    else if (section === 'api') { apiPage(a || undefined); active = '#/api'; }
    else notFound();
    side.innerHTML = sideHtml(active);
    document.querySelectorAll('.topnav a').forEach((l) => l.classList.toggle('on', active.startsWith((l as HTMLAnchorElement).getAttribute('href')!.split('/').slice(0, 2).join('/'))));
    document.title = section ? `Needle — ${section === 'start' ? 'Get started' : section === 'guide' ? a.replace(/-/g, ' ') : section}` : 'Needle — dependency injection for TypeScript';
}

page.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.classList.contains('copy')) {
        navigator.clipboard?.writeText(t.parentElement!.querySelector('code')!.textContent || '');
        t.textContent = 'Copied';
        setTimeout(() => (t.textContent = 'Copy'), 1200);
    } else if (t.dataset.copy) {
        navigator.clipboard?.writeText(t.dataset.copy);
        t.textContent = 'Copied';
        setTimeout(() => (t.textContent = 'Copy'), 1200);
    } else if (t.classList.contains('anchor')) {
        e.preventDefault();
        const parts = location.hash.split('/');
        history.replaceState(null, '', `${parts.slice(0, 3).join('/')}/${t.dataset.anchor}`);
        document.getElementById(t.dataset.anchor!)?.scrollIntoView();
    }
});
$('#theme').addEventListener('click', () => applyTheme({ ...loadTheme(), dark: !document.documentElement.classList.contains('dark') }));
$('#menu').addEventListener('click', () => side.classList.toggle('open'));
window.addEventListener('hashchange', route);
route();
