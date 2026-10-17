 

import { beforeEach, describe, expect, it } from 'vitest';
import { IInjector, Injector } from '../index.js';
import { TYPE_NOT_FOUND } from '../constants/constants.js';
import {
    Cat,
    Child,
    Dog,
    GrandParent,
    Individual,
    NaughtyTurtle,
    Owner,
    Parent,
    getInstance,
    installFreshRootInjector,
} from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Resolution', () => {
        it('should resolve an instance of injector if injector.get invoked with type of Injector', () => {
            const instance = getInstance();
            const instance2 = instance.get(Injector);

            expect(instance2).toBeDefined();
            expect(instance).toBe(instance2);
        });

        it('should create an instance of the type', () => {
            const instance = getInstance();

            instance.register(Child);

            const child = instance.get(Child);

            expect(child).toBeDefined();
            expect(instance.cache.instanceCount).toBe(1);
        });

        it('should create an instance of the type using local resolution strategy', () => {
            const instance = getInstance();
            let invoked = false;

            instance.register(Child, {
                resolution: {
                    resolver: (_injector, _args) => {
                        invoked = true;
                        return new Child();
                    },
                    cacheSyncing: true,
                },
            });

            const child = instance.get(Child);

            expect(child).toBeDefined();
            expect(invoked).toBeTruthy();
            expect(instance.cache.instanceCount).toBe(1);
        });

        it('should return an instance of a subtype in place of a super type using external resolver config', () => {
            const instance = getInstance();
            let invoked = false;

            instance.register(Individual, {
                resolution: {
                    resolver: (_injector, _args) => {
                        invoked = true;
                        return new Child();
                    },
                    cacheSyncing: true,
                },
            });

            const individual = instance.get(Individual);

            expect(individual).toBeDefined();
            expect(individual.id).toBeDefined();
            expect(individual instanceof Child).toBeTruthy();
            expect(invoked).toBeTruthy();
            expect(instance.cache.instanceCount).toBe(1);
        });

        it('should return an instance of a subtype in place of a super type using just the subtype', () => {
            const instance = getInstance();

            instance.register(Child).register(Individual, {
                resolution: Child,
            });

            const individual = instance.get(Individual);

            expect(individual).toBeDefined();
            expect(individual.id).toBeDefined();
            expect(individual instanceof Child).toBeTruthy();
            expect(instance.cache.instanceCount).toBe(2); // Child and the Individual
            expect(instance.cache.resolve(Individual)).toBe(instance.cache.resolve(Child)); // Same references for Subtype and SuperType in cache
        });

        it('should throw an exception if an attempt to resolve a type that is not registered', () => {
            const instance = getInstance();
            let exception: any;

            try {
                instance.get(Child);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot construct Type 'Child' with ancestry 'Child' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
            );
        });

        it('should resolve a type that is using explicit metadata', () => {
            const instance = getInstance();

            const owner = instance
                .register(Owner, { metadata: [Dog, Cat] })
                .register(Dog)
                .register(Cat)
                .get(Owner);

            expect(owner).toBeDefined();
            expect(owner.dog).toBeDefined();
            expect(owner.cat).toBeDefined();
        });

        it('should return undefined for deps', () => {
            const instance = getInstance();

            const owner = instance.register(Owner).register(Dog).register(Cat).get(Owner);

            expect(owner).toBeDefined();
            expect(owner.dog).toBeUndefined();
            expect(owner.cat).toBeUndefined();
        });

        it('should service subsequent instances of a type from the cache', () => {
            const instance = getInstance();

            instance.register(Child);

            const child = instance.get(Child);
            const child2 = instance.get(Child);
            const child3 = instance.get(Child);

            expect(child).toEqual(child2);
            expect(child).toEqual(child3);
            expect(instance.cache.instanceCount).toBe(1);
        });

        it('should construct a tree of dependencies', () => {
            const instance = getInstance();

            instance.register(GrandParent).register(Parent).register(Child);

            const gp = instance.get(GrandParent);

            expect(gp).toBeDefined();
            expect(gp.son).toBeDefined();
            expect(gp.son.daughter).toBeDefined();
        });

        it('should throw exception if dependency in tree is not marked as injectable', () => {
            const instance = getInstance();
            let exception: any;

            instance
                .register(GrandParent)
                // .register(Parent)
                .register(Child);

            try {
                instance.get(GrandParent);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot construct Type 'Parent' with ancestry 'GrandParent -> Parent' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
            );
        });

        it('should throw exception if type reaches maximum tree depth', () => {
            const instance = getInstance();
            let exception: any;

            instance.configuration.maxTreeDepth = 3;
            instance.register(NaughtyTurtle);

            try {
                instance.get(NaughtyTurtle);
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(
                exception.message.includes('as max tree depth has been reached') ||
                    exception.message.includes("Cannot construct Type 'Object' with ancestry"),
            ).toBeTruthy();
        });

        describe('Delegated construction', () => {
            it('should resolve the instance from the externalResolutionStrategy', () => {
                const instance = getInstance();
                let invoked = false;
                let injector: IInjector;

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, currentInjector: IInjector, ..._args: any[]) => {
                        invoked = true;
                        injector = currentInjector;
                        return new Child();
                    },
                };

                const child = instance.get(Child);

                expect(child).toBeDefined();
                expect(injector!).toBeDefined();
                expect(injector! === instance).toBeTruthy();
                expect(invoked).toBeTruthy();
                expect(instance.cache.instanceCount).toBe(0); // Cache should not be updated by default.
            });

            it('should fallback to our injector if the external resolver returns NOT_FOUND and it was correctly registered with the Injector', () => {
                const instance = getInstance();
                let invoked = false;
                instance.register(Child);

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, _currentInjector: IInjector, ..._args: any[]) => {
                        invoked = true;
                        return TYPE_NOT_FOUND;
                    },
                };

                const child = instance.get(Child);

                expect(child).toBeDefined();
                expect(invoked).toBeTruthy();
                expect(instance.cache.instanceCount).toBe(1); // Cache should not be updated by default.
            });

            it('should throw exception if fallback to our injector and no registration found', () => {
                const instance = getInstance();
                let invoked = false;
                let message = '';

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, _currentInjector: IInjector, ..._args: any[]) => {
                        invoked = true;
                        return TYPE_NOT_FOUND;
                    },
                };

                try {
                    instance.get(Child);
                } catch (ex) {
                    message = (ex as any).message;
                }

                expect(invoked).toBeTruthy();
                expect(message).toBe(
                    `Cannot construct Type 'Child' with ancestry 'Child' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
                );
                expect(instance.cache.instanceCount).toBe(0); // Cache should not be updated by default.
            });

            it('should resolve the instance from the externalResolutionStrategy and sync into cache if cacheSyncing = true', () => {
                const instance = getInstance();
                let invoked = false;
                instance.register(Child);

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, ..._args: any[]) => {
                        invoked = true;
                        return new Child();
                    },
                    cacheSyncing: true,
                };

                const child = instance.get(Child);

                expect(child).toBeDefined();
                expect(invoked).toBeTruthy();
                expect(instance.cache.instanceCount).toBe(1); // Cache should not be updated by default.
            });

            it('should resolve the instance from the externalResolutionStrategy first time only and then service from cache if cacheSyncing = true for subsequent requests', () => {
                const instance = getInstance();
                let invoked = 0;
                instance.register(Child);

                instance.configuration.externalResolutionStrategy = {
                    resolver: (_type, ..._args: any[]) => {
                        ++invoked;
                        return new Child();
                    },
                    cacheSyncing: true,
                };

                const child = instance.get(Child);
                const child2 = instance.get(Child);

                expect(child).toBeDefined();
                expect(child2).toBeDefined();
                expect(child).toBe(child2);
                expect(invoked).toEqual(1);
                expect(instance.cache.instanceCount).toBe(1); // Cache should not be updated by default.
            });
        });
    });
});
