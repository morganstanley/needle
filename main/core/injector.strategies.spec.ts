 

import { beforeEach, describe, expect, it } from 'vitest';
import { Strategy } from '../index.js';
import {
    Strategy1,
    Strategy2,
    StrategyOwner,
    getInstance,
    installFreshRootInjector,
} from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Strategies', () => {
        it('should register the injectable type as a strategy (String token)', () => {
            const instance = getInstance();

            instance.register(Strategy1, {
                strategy: 'my-test-strategy',
            });

            const tokens = instance.tokenCache.getStrategyConsumers('my-test-strategy');

            expect(tokens).toBeDefined();
            expect(tokens.length).toBe(1);
        });

        it('should register the injectable type as a strategy (Symbol token)', () => {
            const instance = getInstance();
            const strategySymbol = Symbol.for('my-test-strategy');

            instance.register(Strategy1, {
                strategy: strategySymbol,
            });

            const tokens = instance.tokenCache.getStrategyConsumers(strategySymbol);

            expect(tokens).toBeDefined();
            expect(tokens.length).toBe(1);
        });

        it('should allow registering multiple injectable types under same strategy', () => {
            const instance = getInstance();

            instance
                .register(Strategy1, {
                    strategy: 'my-test-strategy',
                })
                .register(Strategy2, {
                    strategy: 'my-test-strategy',
                });
            const tokens = instance.tokenCache.getStrategyConsumers('my-test-strategy');

            expect(tokens).toBeDefined();
            expect(tokens.length).toBe(2);
        });

        it('should resolve an empty array of strategies when no strategies registered', () => {
            const instance = getInstance();

            instance.register(StrategyOwner, {});

            instance.registerParamForStrategyInjection('my-test-strategy', StrategyOwner, 0);

            const owner = instance.get(StrategyOwner);

            expect(owner).toBeDefined();
            expect(owner.workStrategies).toEqual([]);
        });

        it('should resolve an empty array of strategies when no strategies registered', () => {
            const instance = getInstance();

            const strategies = instance.getStrategies('no-matches');

            expect(strategies).toEqual([]);
        });

        it('should return a single strategy when one has been registered', () => {
            const instance = getInstance();

            instance.register(StrategyOwner, {}).register(Strategy1, {
                strategy: 'my-test-strategy',
            });

            // Lets dynamically setup a @Strategy annotation for first parameter in StrategyOwner's constructor
            Strategy('my-test-strategy')(StrategyOwner, 'strategies', 0);

            const owner = instance.get(StrategyOwner);

            expect(owner).toBeDefined();
            expect(owner.workStrategies.length).toBe(1);
            expect(owner.workStrategies[0] instanceof Strategy1).toBeTruthy();
        });

        it('should return multiple strategies when multiple have been registered', () => {
            const instance = getInstance();

            instance
                .register(StrategyOwner, {})
                .register(Strategy1, {
                    strategy: 'my-test-strategy',
                })
                .register(Strategy2, {
                    strategy: 'my-test-strategy',
                });

            // Lets dynamically setup a @Strategy annotation for first parameter in StrategyOwner's constructor
            Strategy('my-test-strategy')(StrategyOwner, 'strategies', 0);

            const owner = instance.get(StrategyOwner);

            expect(owner).toBeDefined();
            expect(owner.workStrategies.length).toBe(2);
            expect(owner.workStrategies[0] instanceof Strategy1).toBeTruthy();
            expect(owner.workStrategies[1] instanceof Strategy2).toBeTruthy();
        });

        it('should return multiple strategies when multiple have been registered (String token)', () => {
            const instance = getInstance();

            instance
                .register(Strategy1, {
                    strategy: 'my-test-strategy',
                })
                .register(Strategy2, {
                    strategy: 'my-test-strategy',
                });

            const strategies = instance.getStrategies('my-test-strategy');

            expect(strategies).toBeDefined();
            expect(strategies.length).toBe(2);
            expect(strategies[0] instanceof Strategy1).toBeTruthy();
            expect(strategies[1] instanceof Strategy2).toBeTruthy();
        });

        it('should return multiple strategies when multiple have been registered (Symbol token)', () => {
            const instance = getInstance();
            const strategySymbol = Symbol.for('my-test-strategy');

            instance
                .register(Strategy1, {
                    strategy: strategySymbol,
                })
                .register(Strategy2, {
                    strategy: strategySymbol,
                });

            const strategies = instance.getStrategies(strategySymbol);

            expect(strategies).toBeDefined();
            expect(strategies.length).toBe(2);
            expect(strategies[0] instanceof Strategy1).toBeTruthy();
            expect(strategies[1] instanceof Strategy2).toBeTruthy();
        });
    });
});
