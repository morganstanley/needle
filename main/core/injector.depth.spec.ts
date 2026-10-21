 

import { beforeEach, describe, expect, it } from 'vitest';
import { Strategy } from '../index.js';
import {
    Cat,
    Child,
    Dog,
    Engine,
    EngineInterceptor,
    Owner,
    Parent,
    Strategy1,
    StrategyOwner,
    getInstance,
    installFreshRootInjector,
} from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    function getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    describe('Depth Tests', () => {
        const testCount = 10;

        type ITestRun = { depth: number; registrationLevel: number; resolutionLevel: number };

        const generateTestExecutionData = (depthOfTree = 30) => {
            const testData = new Array<ITestRun>();

            while (testData.length < testCount) {
                const depth = getRandomInt(1, depthOfTree);
                const registrationLevel = getRandomInt(1, depth);
                const resolutionLevel = getRandomInt(registrationLevel, depth);

                if (registrationLevel !== resolutionLevel) {
                    testData.push({ depth, registrationLevel, resolutionLevel });
                }
            }

            return testData;
        };

        const getTestInfoAsText = (test: ITestRun) =>
            `Tree depth: [${test.depth}], Registration: [${test.registrationLevel}], Scope: [${test.resolutionLevel}] `;

        it('should return a new instances when scope created', () => {
            const instance = getInstance();

            const scoped = instance.createScope('test-scope');

            expect(scoped).toBeDefined();
            expect(scoped.id).not.toBe(instance.id);
            expect(scoped.getRegisteredTypes()).toEqual([]);
            expect(scoped.isRoot()).toBeFalsy();
            expect(scoped.isScoped).toBeTruthy();
            expect(scoped.parent).toBeDefined();
            expect(scoped.parent!.id).toBe(instance.id);
            expect(scoped.name).toBe('test-scope');
            expect(scoped.cache.instanceCount).toBe(0);
        });

        it('should resolve a type if the parent injector has a valid registration.', () => {
            const instance = getInstance();
            instance.register(Child);

            const scoped = instance.createScope('test-scope');
            const child = scoped.get(Child);

            expect(child).toBeDefined();
        });

        it('should resolve a scope based on its name an Id', () => {
            const instance = getInstance();
            instance.register(Child);

            const scope = instance.createScope('test-scope');
            const namedScope = instance.getScope('test-scope');
            const idScope = instance.getScope(scope.id);
            expect(namedScope).toBeDefined();
            expect(idScope).toBeDefined();
            expect(idScope === namedScope).toBeTruthy();
        });

        it('should return undefined if scope is not found', () => {
            const instance = getInstance();
            instance.register(Child);

            instance.createScope('test-scope');
            const noMatchScope = instance.getScope('NO_MATCH');

            expect(noMatchScope).toBeUndefined();
        });

        describe('Ancestry', () => {
            describe('Resolution', () => {
                describe('Resolve instance from ancestor with explicit metadata', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance
                                .getScope(`level-${test.registrationLevel}`)!
                                .register(Owner, { metadata: [Dog, Cat] })
                                .register(Dog)
                                .register(Cat);

                            const owner = instance.getScope(`level-${test.resolutionLevel}`)!.get(Owner);

                            expect(owner).toBeDefined();
                        });
                    });
                });

                describe('Resolve instance from ancestor', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.register(Child);

                            const child = instance.getScope(`level-${test.resolutionLevel}`)!.get(Child);

                            expect(child).toBeDefined();
                        });
                    });
                });

                describe('Resolve instance from ancestor using token', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve instance using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.register(Child, {
                                tokens: ['ancestor-token'],
                            });

                            const child = instance.getScope(`level-${test.resolutionLevel}`)!.get('ancestor-token');

                            expect(child).toBeDefined();
                        });
                    });
                });

                describe('Resolve value from ancestor using token', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve value using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.registerValue<string>({
                                tokens: ['ancestor-token'],
                                value: 'ancestor',
                            });

                            const ancestorValue = instance
                                .getScope(`level-${test.resolutionLevel}`)!
                                .get('ancestor-token');

                            expect(ancestorValue).toBeDefined();
                            expect(ancestorValue).toBe('ancestor');
                        });
                    });
                });

                describe('Resolve strategy from ancestor', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve strategies using ancestors registration - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            injector.register(StrategyOwner, {}).register(Strategy1, {
                                strategy: 'my-test-strategy',
                            });

                            // Lets dynamically setup a @Strategy annotation for first parameter in StrategyOwner's constructor
                            Strategy('my-test-strategy')(StrategyOwner, 'strategies', 0);

                            const owner = instance.getScope(`level-${test.resolutionLevel}`)!.get(StrategyOwner);

                            expect(owner.workStrategies.length).toBe(1);
                            expect(owner.workStrategies[0] instanceof Strategy1).toBeTruthy();
                        });
                    });
                });

                describe('Resolve factory from ancestor', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve factory using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.register(Child);

                            const child = instance
                                .getScope(`level-${test.resolutionLevel}`)!
                                .getFactory(Child)
                                .create();

                            expect(child).toBeDefined();
                        });
                    });
                });

                describe('Resolve lazy from ancestor', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve lazy.value using ancestors registration - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            instance.getScope(`level-${test.registrationLevel}`)!.register(Child);

                            const child = instance.getScope(`level-${test.resolutionLevel}`)!.getLazy(Child).value;

                            expect(child).toBeDefined();
                        });
                    });
                });
            });

            describe('Destroy', () => {
                describe('with parent (In middle of tree) where destroy is invoked', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve using ancestors registration - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);
                            const parent = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scope = parent.getScope(`level-${test.resolutionLevel}`)!;
                            const destroyed = scope.isDestroyed();
                            parent.destroy();

                            expect(destroyed).not.toBe(scope.isDestroyed());
                            expect(scope.isDestroyed()).toBeTruthy();
                            expect(parent.children.has(scope.id)).toBeFalsy();
                        });
                    });
                });
            });

            describe('Interception', () => {
                describe('with interceptor registered in parent and type resolved from scope', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should intercept the construction - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);
                            const parent = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scope = parent.getScope(`level-${test.resolutionLevel}`)!;
                            const interceptor = new EngineInterceptor();

                            parent.registerInterceptor(interceptor);
                            parent.register(Engine);
                            const registration = parent.getRegistrationForType(Engine);

                            const engine = scope.get(Engine);

                            expect(engine).toBeDefined();
                            expect(interceptor.beforeInvocation.length).toBe(1);
                            expect(interceptor.beforeInvocation[0]).toBeDefined();
                            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
                            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
                            expect(interceptor.beforeInvocation[0].injector).toBe(parent);
                            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

                            expect(interceptor.afterInvocation.length).toBe(1);
                            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
                            expect(interceptor.afterInvocation[0].context).toBeDefined();
                            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
                            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
                            expect(interceptor.afterInvocation[0].context.injector).toBe(parent);
                            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
                        });
                    });
                });

                describe('with interceptor registered in scope and type resolved from parent', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should intercept the construction - ${getTestInfoAsText(test)}`, () => {
                            const instance = getInstance(true, test.depth);
                            const parent = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scope = parent.getScope(`level-${test.resolutionLevel}`)!;
                            const interceptor = new EngineInterceptor();

                            scope.registerInterceptor(interceptor);
                            parent.register(Engine);
                            const registration = parent.getRegistrationForType(Engine);

                            const engine = scope.get(Engine);

                            expect(engine).toBeDefined();
                            expect(interceptor.beforeInvocation.length).toBe(1);
                            expect(interceptor.beforeInvocation[0]).toBeDefined();
                            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
                            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
                            expect(interceptor.beforeInvocation[0].injector).toBe(parent);
                            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

                            expect(interceptor.afterInvocation.length).toBe(1);
                            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
                            expect(interceptor.afterInvocation[0].context).toBeDefined();
                            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
                            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
                            expect(interceptor.afterInvocation[0].context.injector).toBe(parent);
                            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
                        });
                    });
                });

                describe('with interceptor registered directly in root and type resolved from parent and scope', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should intercept the construction only once - ${getTestInfoAsText(test)}`, () => {
                            const root = getInstance(true, test.depth);
                            const parent = root.getScope(`level-${test.registrationLevel}`)!;
                            const scope = parent.getScope(`level-${test.resolutionLevel}`)!;
                            const interceptor = new EngineInterceptor();

                            root.registerInterceptor(interceptor);
                            parent.register(Engine);
                            const registration = parent.getRegistrationForType(Engine);

                            const engine = scope.get(Engine);
                            const engine2 = scope.get(Engine);

                            expect(engine).toBeDefined();
                            expect(engine2).toBeDefined();
                            expect(engine2 === engine).toBeTruthy();
                            expect(interceptor.beforeInvocation.length).toBe(1);
                            expect(interceptor.beforeInvocation[0]).toBeDefined();
                            expect(interceptor.beforeInvocation[0].configuration).toBe(registration!);
                            expect(interceptor.beforeInvocation[0].constructorArgs).toEqual([]);
                            expect(interceptor.beforeInvocation[0].injector).toBe(parent);
                            expect(interceptor.beforeInvocation[0].type).toBe(Engine);

                            expect(interceptor.afterInvocation.length).toBe(1);
                            expect(interceptor.afterInvocation[0].instance instanceof Engine).toBeTruthy();
                            expect(interceptor.afterInvocation[0].context).toBeDefined();
                            expect(interceptor.afterInvocation[0].context.configuration).toBe(registration!);
                            expect(interceptor.afterInvocation[0].context.constructorArgs).toEqual([]);
                            expect(interceptor.afterInvocation[0].context.injector).toBe(parent);
                            expect(interceptor.afterInvocation[0].context.type).toBe(Engine);
                        });
                    });
                });
            });

            describe('Overriding', () => {
                describe('with registerInstance() override in a scope', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`should resolve the instance from the local scope ignoring the instance already resolved in parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const ancestralInjector = instance
                                .getScope(`level-${test.registrationLevel}`)!
                                .register(Child);

                            const child = ancestralInjector.get(Child);

                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;
                            scoped.registerInstance(Child, new Child());
                            const scopedChild = scoped.get(Child);

                            expect(child === scopedChild).toBeFalsy();
                        });
                    });
                });

                describe('with registerValue() override in a scope', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`should resolve the value from the local scope ignoring the value already resolved in parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const ancestralInjector = instance
                                .getScope(`level-${test.registrationLevel}`)!
                                .registerValue<string>({
                                    tokens: ['my-value'],
                                    value: 'value-parent',
                                });

                            const value1 = ancestralInjector.get('my-value');
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            scoped.registerValue<string>({
                                tokens: ['my-value'],
                                value: 'value-child',
                            });

                            const value2 = scoped.get('my-value');

                            expect(value1 === value2).toBeFalsy();
                        });
                    });
                });

                describe('with register.strategies override in a scope', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`should resolve a different set of strategies ignoring those already resolved in the parent scopes (string token)- ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            injector.register(Strategy1, {
                                strategy: 'my-test-strategy',
                            });

                            scoped.register(Strategy1, {
                                strategy: 'my-test-strategy',
                            });

                            const ancestorStrategies = injector.getStrategies('my-test-strategy');
                            const scopedStrategies = scoped.getStrategies('my-test-strategy');

                            expect(ancestorStrategies.length).toBe(1);
                            expect(scopedStrategies.length).toBe(1);
                            expect(scopedStrategies[0] === ancestorStrategies[0]).toBeFalsy();
                        });
                    });
                });

                describe('with register.tokens override in a scope', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`should resolve the instance from local scope using a String token ignoring the instance already resolved in parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);
                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            injector.register(Child, {
                                tokens: ['child-instance'],
                            });

                            scoped.register(Child, {
                                tokens: ['child-instance'],
                            });

                            const ancestorChild = injector.get('child-instance');
                            const scopeChild = scoped.get('child-instance');

                            expect(ancestorChild).toBeDefined();
                            expect(scopeChild).toBeDefined();
                            expect(ancestorChild).not.toBe(scopeChild);
                        });
                    });

                    generateTestExecutionData().forEach((test) => {
                        it(`should resolve the instance from local scope using a Symbol token ignoring the instance already resolved in parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);
                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;
                            const childSymbol = Symbol.for('child-instance');

                            injector.register(Child, {
                                tokens: ['child-instance'],
                            });

                            scoped.register(Child, {
                                tokens: [childSymbol],
                            });

                            const ancestorChild = injector.get<Child>('child-instance');
                            const scopeChild = scoped.get<Child>(childSymbol);

                            expect(ancestorChild).toBeDefined();
                            expect(scopeChild).toBeDefined();
                            expect(ancestorChild).not.toBe(scopeChild);
                        });
                    });
                });

                describe('with type registered in local scope and registrar.getLazy invoked', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve an instance from the local scope ignoring parent scopes - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            injector.register(Child);

                            scoped.register(Child);

                            const ancestorChild = injector.getLazy(Child).value;
                            const scopeChildLazy = scoped.getLazy(Child);

                            expect(scopeChildLazy.hasValue).toBeFalsy();
                            expect(scopeChildLazy.value).toBeDefined();
                            expect(scopeChildLazy.value).not.toBe(ancestorChild);
                        });
                    });
                });

                describe('with type registered in local scope with scoped dependency and registrar.getFactory invoked', () => {
                    generateTestExecutionData().forEach((test) => {
                        it(`Should resolve an new instance with each instance having a scoped shared dependency - ${getTestInfoAsText(
                            test,
                        )}`, () => {
                            const instance = getInstance(true, test.depth);

                            const injector = instance.getScope(`level-${test.registrationLevel}`)!;
                            const scoped = instance.getScope(`level-${test.resolutionLevel}`)!;

                            injector.register(Parent).register(Child);

                            scoped.register(Parent).register(Child);

                            const parentFactory = injector.getFactory(Parent);
                            const scopedFactory = scoped.getFactory(Parent);

                            const parentInstance1 = parentFactory.create();
                            const parentInstance2 = parentFactory.create();
                            const scopedInstance1 = scopedFactory.create();
                            const scopedInstance2 = scopedFactory.create();

                            expect(parentInstance1).toBeDefined();
                            expect(parentInstance2).toBeDefined();
                            expect(scopedInstance1).toBeDefined();
                            expect(scopedInstance2).toBeDefined();
                            expect(scopedInstance1 === scopedInstance2).toBeFalsy();
                            expect(scopedInstance1 === parentInstance1).toBeFalsy();
                            expect(scopedInstance1.daughter === parentInstance1.daughter).toBeFalsy();
                            expect(scopedInstance1.daughter === scopedInstance2.daughter).toBeTruthy();
                        });
                    });
                });
            });
        });
    });
});
