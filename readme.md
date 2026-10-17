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

Requires TypeScript >= 5.7 < 6 with `experimentalDecorators` and `emitDecoratorMetadata` enabled (see [Getting started](docs/getting-started.md) if you would rather use explicit metadata).

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

Full guides live in [`docs/`](docs/README.md):

- [Getting started](docs/getting-started.md), [Tokens](docs/tokens.md), [Strategies](docs/strategies.md), [Factories](docs/factories.md), [Lazy and optional](docs/lazy-and-optional.md)
- [Instances and values](docs/instances-and-values.md), [External resolution](docs/external-resolution.md), [Caching](docs/caching.md), [Scopes](docs/scopes.md), [Interception](docs/interception.md)
- [Metrics](docs/metrics.md), [Configuration](docs/configuration.md), [Errors and logging](docs/errors-and-logging.md), [Semantic injection](docs/semantic-injection.md), [Angular](docs/angular.md)
- [Feature support matrix](docs/feature-support.md), [Troubleshooting](docs/troubleshooting.md), [Contributing and benchmarks](docs/contributing.md)

Runnable examples are in [`examples/`](examples) (`npm run examples`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/contributing.md](docs/contributing.md) for the toolchain and benchmark report.
