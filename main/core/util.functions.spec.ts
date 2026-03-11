import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DI_ROOT_INJECTOR_KEY } from '../constants/constants.js';
import {
    get,
    getLazy,
    getOptional,
    getRegisteredTypes,
    getRegisteredTypesWithDependencies,
    getRootInjector,
} from './util.functions.js';

describe('util.functions', () => {
    const getMock = vi.fn();
    const getOptionalMock = vi.fn();
    const getRegisteredTypesMock = vi.fn();
    const getRegisteredTypesWithDepsMock = vi.fn();
    const root = {
        get: getMock,
        getOptional: getOptionalMock,
        getRegisteredTypes: getRegisteredTypesMock,
        getRegisteredTypesWithDependencies: getRegisteredTypesWithDepsMock,
    };

    beforeEach(() => {
        getMock.mockReset();
        getOptionalMock.mockReset();
        getRegisteredTypesMock.mockReset();
        getRegisteredTypesWithDepsMock.mockReset();
        (globalThis as any)[DI_ROOT_INJECTOR_KEY] = root;
    });

    it('returns the configured root injector', () => {
        expect(getRootInjector()).toBe(root);
    });

    it('delegates get/getOptional/getRegistered helpers', () => {
        class Thing {}
        getMock.mockReturnValue('resolved');
        getOptionalMock.mockReturnValue(undefined);
        getRegisteredTypesMock.mockReturnValue([Thing]);
        getRegisteredTypesWithDepsMock.mockReturnValue([{ provide: Thing, deps: [] }]);

        expect(get(Thing)).toBe('resolved');
        expect(getOptional(Thing)).toBeUndefined();
        expect(getRegisteredTypes()).toEqual([Thing]);
        expect(getRegisteredTypesWithDependencies()).toEqual([{ provide: Thing, deps: [] }]);
    });

    it('returns lazy closures that resolve on invocation', () => {
        class Thing {}
        getMock.mockReturnValueOnce('lazy-value');

        const lazy = getLazy(Thing);
        expect(getMock).not.toHaveBeenCalled();
        expect(lazy()).toBe('lazy-value');
    });
});
