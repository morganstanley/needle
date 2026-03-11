import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DI_ROOT_INJECTOR_KEY } from '../constants/constants.js';
import { Injector } from './injector.js';
import { getConstructorTypes } from './metadata.functions.js';

class Dependency {}
class Target {
    constructor(_dep: Dependency) {}
}

describe('getConstructorTypes', () => {
    beforeEach(() => {
        (globalThis as any)[DI_ROOT_INJECTOR_KEY] = Injector.create();
    });

    it('returns explicit metadata in explicit mode', () => {
        const injector = (globalThis as any)[DI_ROOT_INJECTOR_KEY] as Injector;
        injector.configuration.metadataMode = 'explicit';
        injector.register(Target, { metadata: [Dependency] });

        expect(getConstructorTypes(Target)).toEqual([Dependency]);
    });

    it('falls back to reflection in reflection mode', () => {
        const injector = (globalThis as any)[DI_ROOT_INJECTOR_KEY] as Injector;
        injector.configuration.metadataMode = 'reflection';

        const reflectSpy = vi.spyOn(Reflect as any, 'getMetadata').mockReturnValue([Dependency]);
        expect(getConstructorTypes(Target)).toEqual([Dependency]);
        reflectSpy.mockRestore();
    });
});
