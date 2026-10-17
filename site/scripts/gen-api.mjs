// Generates src/api.json (the API reference data) straight from the library's public exports using the TypeScript compiler.
// Deliberately independent of typedoc.
import ts from 'typescript';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const configPath = resolve(root, 'main/tsconfig.json');
const cfg = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, dirname(configPath));
const program = ts.createProgram([resolve(root, 'main/index.ts')], { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();
const entry = program.getSourceFile(resolve(root, 'main/index.ts'));
const moduleSymbol = checker.getSymbolAtLocation(entry);

const doc = (symbol) => ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
const tag = (symbol, name) => symbol.getJsDocTags(checker).find((t) => t.name === name);
const clean = (s) => s.replace(/\s+/g, ' ').trim();
const typeStr = (t, node) => clean(checker.typeToString(t, node, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope));

function memberInfo(sym, decl) {
    const t = checker.getTypeOfSymbolAtLocation(sym, decl);
    const optional = (sym.flags & ts.SymbolFlags.Optional) !== 0;
    const isMethod = (sym.flags & ts.SymbolFlags.Method) !== 0 || t.getCallSignatures().length > 0;
    let signature;
    if (isMethod) {
        signature = t.getCallSignatures().map((s) => clean(checker.signatureToString(s, decl, ts.TypeFormatFlags.NoTruncation))).join(' | ');
        signature = `${sym.name}${optional ? '?' : ''}${signature}`;
    } else {
        signature = `${sym.name}${optional ? '?' : ''}: ${typeStr(t, decl)}`;
    }
    return { name: sym.name, kind: isMethod ? 'method' : 'property', signature, doc: doc(sym) };
}

const items = [];
for (const exp of checker.getExportsOfModule(moduleSymbol)) {
    const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
    const decl = sym.declarations?.[0];
    if (!decl) continue;
    if (/\.spec\.ts$/.test(decl.getSourceFile().fileName)) continue;
    const file = decl.getSourceFile().fileName.replace(root + '/', '');
    const base = { name: exp.name, doc: doc(sym), file, deprecated: !!tag(sym, 'deprecated') };
    if (ts.isInterfaceDeclaration(decl) || ts.isClassDeclaration(decl)) {
        const kind = ts.isInterfaceDeclaration(decl) ? 'interface' : 'class';
        const type = checker.getDeclaredTypeOfSymbol(sym);
        const members = checker
            .getPropertiesOfType(type)
            .filter((m) => {
                const d = m.declarations?.[0];
                if (!d) return false;
                if (program.isSourceFileDefaultLibrary(d.getSourceFile()) || d.getSourceFile().fileName.includes('node_modules')) return false;
                const flags = ts.getCombinedModifierFlags(d);
                return !(flags & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) && !m.name.startsWith('_') && !m.name.startsWith('#');
            })
            .map((m) => memberInfo(m, decl));
        const statics = kind === 'class' ? checker.getPropertiesOfType(checker.getTypeOfSymbolAtLocation(sym, decl)).filter((m) => !['prototype'].includes(m.name) && m.declarations?.[0] && !(ts.getCombinedModifierFlags(m.declarations[0]) & ts.ModifierFlags.Private)).map((m) => ({ ...memberInfo(m, decl), static: true })) : [];
        items.push({ ...base, kind, members: [...statics, ...members] });
    } else if (ts.isFunctionDeclaration(decl)) {
        const sigs = checker.getTypeOfSymbolAtLocation(sym, decl).getCallSignatures();
        items.push({ ...base, kind: 'function', signature: sigs.map((s) => `function ${exp.name}${clean(checker.signatureToString(s, decl, ts.TypeFormatFlags.NoTruncation))}`).join('\n') });
    } else if (ts.isTypeAliasDeclaration(decl)) {
        items.push({ ...base, kind: 'type', signature: clean(decl.getText()) });
    } else if (ts.isVariableDeclaration(decl)) {
        const t = checker.getTypeOfSymbolAtLocation(sym, decl);
        const callable = t.getCallSignatures().length > 0;
        items.push({
            ...base,
            kind: callable ? 'function' : 'constant',
            signature: callable
                ? t.getCallSignatures().map((s) => `function ${exp.name}${clean(checker.signatureToString(s, decl, ts.TypeFormatFlags.NoTruncation))}`).join('\n')
                : `const ${exp.name}: ${typeStr(t, decl)}`,
        });
    } else if (ts.isEnumDeclaration(decl)) {
        items.push({ ...base, kind: 'enum', signature: clean(decl.getText()) });
    }
}
const order = ['class', 'function', 'interface', 'type', 'constant', 'enum'];
items.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.name.localeCompare(b.name));
writeFileSync(resolve(here, '../src/api.json'), JSON.stringify(items, null, 1));
console.log(`api.json: ${items.length} exports`);
