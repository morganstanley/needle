# Needle docs site

A static docs and demo site for Needle, built with Vite. It is independent of typedoc.

- **Guides** render the markdown in [`../docs`](../docs) at build time.
- **API reference** is generated from the public exports by [`scripts/gen-api.mjs`](scripts/gen-api.mjs) (TypeScript compiler API).
- **Live examples** ([`src/examples.ts`](src/examples.ts)) run the real library in the browser. [`scripts/check-examples.mjs`](scripts/check-examples.mjs) runs every one against the built library during `npm run build`, so they can't rot.
- **Theming**: the site is driven by a few CSS custom properties (`--accent`, `--radius`, dark mode) editable on the Theming page.

```bash
npm ci && npm run build   # in the repo root: builds the library into dist/
cd site
npm ci
npm run dev               # local dev server
npm run build             # type-checks examples, builds to site/dist
```

Deployed to GitHub Pages by `.github/workflows/docs-site.yml`.
