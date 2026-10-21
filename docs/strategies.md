# Strategies

## Creating strategies

Strategies allow us to register multiple type providers against a given strategy key and then inject an array of all the strategies in the given consumer class. An injectable type can both exist as a strategy and pure injectable at the same time.

Creating strategies can be achieved using the `@Injectable` decorator or the API. Both approaches make use of the `strategy` property on the injectable config.

## Registering strategies

```typescript
import { Injectable } from '@morgan-stanley/needle';

interface IStrategy {}

@Injectable({
    strategy: 'work-strategies',
})
export class Strategy1 implements IStrategy {}

// tslint:disable-next-line:max-classes-per-file
@Injectable({
    strategy: 'work-strategies',
})
export class Strategy2 implements IStrategy {}
```

or registering via the API would look like this.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector()
    .register(Strategy1, {
        strategy: 'work-strategies',
    })
    .register(Strategy2, {
        strategy: 'work-strategies',
    });
```

To avoid naming conflicts that can occur with strings, you can also use `symbols` for your strategy names. Below is an example of this using the injector API.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';
const strategySymbol = Symbol.for('work-strategies');

getRootInjector()
    .register(Strategy1, {
        strategy: strategySymbol,
    })
    .register(Strategy2, {
        strategy: strategySymbol,
    });
```

## Resolving strategies

When it comes to injecting lists of strategies we can use the `@Strategy` decorator to mark that we expect an array of strategies. You can register consumers of strategies using this decorator or the API.

```typescript
import { Injectable, get } from '@morgan-stanley/needle';

@Injectable()
export class StrategyConsumer {
    constructor(@Strategy('work-strategies') public workStrategies: IStrategy[]) {}
}

const instance = get(StrategyConsumer);

console.log(instance.workStrategies.length); // 2 strategies
```

Or using the API we can resolve a list of strategies in the following way.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const strategies = getRootInjector().getStrategies('work-strategies');

console.log(strategies.length); // 2 strategies
```
