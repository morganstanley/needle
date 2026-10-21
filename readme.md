# @morgan-stanley/needle

![Lifecycle Active](https://img.shields.io/badge/Lifecycle-Active-brightgreen)
![npm](https://img.shields.io/npm/v/@morgan-stanley/needle)
[![Build Status](https://github.com/morganstanley/needle/actions/workflows/build.yml/badge.svg)](https://github.com/morganstanley/needle/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/MorganStanley/needle/branch/master/graph/badge.svg)](https://codecov.io/gh/MorganStanley/needle)
[![Known Vulnerabilities](https://snyk.io/test/github/MorganStanley/needle/badge.svg)](https://snyk.io/test/github/MorganStanley/needle)
![NPM](https://img.shields.io/npm/l/@morgan-stanley/needle)
![NPM](https://img.shields.io/badge/types-TypeScript-blue)

# What is Needle?

Needle is a lightweight & powerful dependency injection container for supporting the development of universal code with full semantic runtime injection. It helps you increase the testability of your applications as well as decoupling your code more effectively

## Install

```bash
npm install @morgan-stanley/needle reflect-metadata
```

Requires TypeScript >= 5.7 < 6 with `experimentalDecorators` and `emitDecoratorMetadata` enabled (see [Getting started](https://github.com/morganstanley/needle/blob/main/docs/getting-started.md) if you would rather use explicit metadata).

## Quick start

```typescript
import 'reflect-metadata'; // must be the first import in your app
import { getRootInjector, Injectable } from '@morgan-stanley/needle';

@Injectable()
class Engine {}

@Injectable()
class Car {
    constructor(public engine: Engine) {}
}

const car = getRootInjector().get(Car); // Engine is constructed and injected for you
```

## Why use this?

- Simple & lightweight
- Can be used in many different JavaScript contexts: node, browsers, angular, react or vanilla js
- Provides a non-invasive way to stand up a tree of dependencies
- Increases your code testability
- Supports semantic versioning injection

## Documentation

Full guides live in [`docs/`](https://github.com/morganstanley/needle/blob/main/docs/README.md):

- [Getting started](https://github.com/morganstanley/needle/blob/main/docs/getting-started.md), [Tokens](https://github.com/morganstanley/needle/blob/main/docs/tokens.md), [Strategies](https://github.com/morganstanley/needle/blob/main/docs/strategies.md), [Factories](https://github.com/morganstanley/needle/blob/main/docs/factories.md), [Lazy and optional](https://github.com/morganstanley/needle/blob/main/docs/lazy-and-optional.md)
- [Instances and values](https://github.com/morganstanley/needle/blob/main/docs/instances-and-values.md), [External resolution](https://github.com/morganstanley/needle/blob/main/docs/external-resolution.md), [Caching](https://github.com/morganstanley/needle/blob/main/docs/caching.md), [Scopes](https://github.com/morganstanley/needle/blob/main/docs/scopes.md), [Interception](https://github.com/morganstanley/needle/blob/main/docs/interception.md)
- [Metrics](https://github.com/morganstanley/needle/blob/main/docs/metrics.md), [Configuration](https://github.com/morganstanley/needle/blob/main/docs/configuration.md), [Errors and logging](https://github.com/morganstanley/needle/blob/main/docs/errors-and-logging.md), [Semantic injection](https://github.com/morganstanley/needle/blob/main/docs/semantic-injection.md), [Angular](https://github.com/morganstanley/needle/blob/main/docs/angular.md)
- [Feature support matrix](https://github.com/morganstanley/needle/blob/main/docs/feature-support.md), [Module formats (ESM/CJS)](https://github.com/morganstanley/needle/blob/main/docs/module-formats.md), [Troubleshooting](https://github.com/morganstanley/needle/blob/main/docs/troubleshooting.md), [Contributing and benchmarks](https://github.com/morganstanley/needle/blob/main/docs/contributing.md)

Runnable examples are in [`examples/`](examples) (`npm run examples`).

## Contributing

See [CONTRIBUTING.md](https://github.com/morganstanley/needle/blob/main/CONTRIBUTING.md) and [docs/contributing.md](https://github.com/morganstanley/needle/blob/main/docs/contributing.md) for the toolchain and benchmark report.
