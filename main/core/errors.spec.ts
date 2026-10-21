import { describe, expect, it } from 'vitest';
import { Injectable } from '../annotations/injectable.js';
import { Injector } from './injector.js';
import {
    DuplicateTokenError,
    InjectorDestroyedError,
    MaxDepthExceededError,
    MissingValueTokenError,
    NeedleError,
    NotResolvableError,
    ResolutionError,
    TypeNotRegisteredError,
} from './errors.js';

class Leaf {}
@Injectable()
class Branch {
    constructor(public leaf: Leaf) {}
}

describe('errors', () => {
    it('throws TypeNotRegisteredError with the resolution path', () => {
        const injector = Injector.create();
        injector.register(Branch);
        try {
            injector.get(Branch);
            expect.unreachable();
        } catch (e) {
            expect(e).toBeInstanceOf(TypeNotRegisteredError);
            expect(e).toBeInstanceOf(ResolutionError);
            expect(e).toBeInstanceOf(NeedleError);
            expect(e).toBeInstanceOf(Error);
            const err = e as TypeNotRegisteredError;
            expect(err.code).toBe('NEEDLE_TYPE_NOT_REGISTERED');
            expect(err.name).toBe('TypeNotRegisteredError');
            expect(err.resolutionPath).toEqual(['Branch', 'Leaf']);
            expect(err.message).toContain("ancestry 'Branch -> Leaf'");
        }
    });

    it('throws NotResolvableError for unknown tokens and types, with path', () => {
        const injector = Injector.create();
        expect(() => injector.get('missing')).toThrow(NotResolvableError);
        expect(() => injector.get('missing')).toThrow("token 'missing'");
        expect(() => injector.get(undefined as any)).toThrow(NotResolvableError);
        const err = new NotResolvableError(Leaf, [Branch]);
        expect(err.message).toContain('(resolution path: Branch)');
        expect(err.typeOrToken).toBe(Leaf);
    });

    it('throws MaxDepthExceededError', () => {
        const injector = Injector.create();
        injector.configuration.maxTreeDepth = 0;
        injector.register(Branch);
        injector.register(Leaf);
        expect(() => injector.get(Branch)).toThrow(MaxDepthExceededError);
    });

    it('throws InjectorDestroyedError', () => {
        const injector = Injector.create();
        injector.destroy();
        expect(() => injector.get(Leaf)).toThrow(InjectorDestroyedError);
    });

    it('throws DuplicateTokenError and MissingValueTokenError', () => {
        const injector = Injector.create();
        injector.register(Leaf, { tokens: ['a'] });
        expect(() => injector.register(Branch, { tokens: ['a'] })).toThrow(DuplicateTokenError);
        expect(() => injector.registerValue({ value: 1, tokens: [] })).toThrow(MissingValueTokenError);
    });
});
