import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const templatePath = resolve(root, 'bench/bench-report.template.html');
const inputPath = resolve(root, 'reports/bench/bench-results.json');
const outputDir = resolve(root, 'reports/bench');
const outputPath = resolve(root, 'reports/bench/bench-report.html');

try {
    const template = readFileSync(templatePath, 'utf8');
    const benchmarkJson = JSON.parse(readFileSync(inputPath, 'utf8'));

    mkdirSync(outputDir, { recursive: true });

    const embeddedData = JSON.stringify(benchmarkJson).replace(/<\//g, '<\\/');
    const injection = `<script>window.__BENCH_DATA__ = ${embeddedData};</script>`;
    const html = template.replace('</head>', `    ${injection}\n</head>`);

    writeFileSync(outputPath, html, 'utf8');

    console.log(`Generated benchmark HTML report: ${outputPath}`);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to generate benchmark report: ${message}`);
    process.exit(1);
}
