# Contributor toolchain

This repository includes an `.nvmrc` file pinned to Node.js 24.

```bash
nvm use
```

If you are not using `nvm`, use the equivalent Node.js 24.x runtime in your local toolchain.

# Benchmark report

To run benchmarks and generate a graphical HTML report:

```bash
npm run bench:report
```

This command writes:

- `reports/bench/bench-results.json`
- `reports/bench/bench-report.html`

If you already have fresh benchmark JSON and only want to rebuild the HTML:

```bash
npm run bench:report:html
```
