import { describe, expect, it } from 'vitest';
import { AutoFactory } from './factory.js';

describe('AutoFactory', () => {
    it('creates instances through the provided factory implementation', () => {
        class Example {
            constructor(public readonly value: number) {}
        }

        const injector = { name: 'root' } as any;
        let boundContext: any;
        let observedArgs: any[] = [];

        const factoryImpl = function (
            this: any,
            type: typeof Example,
            updateCache: boolean,
            options?: { params?: unknown[] },
            ancestors?: Array<any>,
            currentInjector?: any,
        ) {
            boundContext = this;
            observedArgs = [type, updateCache, options, ancestors, currentInjector];
            return new type(options?.params?.[0] as number);
        };

        const factory = new AutoFactory(Example, injector, factoryImpl as any);
        const created = factory.create(7);

        expect(created).toBeInstanceOf(Example);
        expect(created.value).toBe(7);
        expect(boundContext).toBe(injector);
        expect(observedArgs[0]).toBe(Example);
        expect(observedArgs[1]).toBe(false);
        expect(observedArgs[2]).toEqual({ params: [7] });
        expect(observedArgs[3]).toEqual([]);
        expect(observedArgs[4]).toBe(injector);
    });
});
