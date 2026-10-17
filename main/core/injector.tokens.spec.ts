 

import { beforeEach, describe, expect, it } from 'vitest';
import {
    AdoptedChild,
    Child,
    GeographyStudent,
    GeographyTeacher,
    Parent,
    getInstance,
    installFreshRootInjector,
} from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Tokens', () => {
        it('should resolve an instance of the type by token (string)', () => {
            const instance = getInstance();

            instance.register(Child, {
                tokens: ['child'],
            });

            const child = instance.get<typeof Child>('child');

            expect(child).toBeDefined();
        });

        it('should resolve an instance of the type by token (string) and no type info pass returns ANY', () => {
            const instance = getInstance();

            instance.register(Child, {
                tokens: ['child'],
            });

            const child = instance.get('child');

            expect(child).toBeDefined();
        });

        it('should resolve an instance of the type by token (symbol)', () => {
            const instance = getInstance();

            const symbol = Symbol.for('child');

            instance.register(Child, {
                tokens: [symbol],
            });

            const child = instance.get<typeof Child>(symbol);

            expect(child).toBeDefined();
        });

        it('should resolve the correct instance based on the token defined in the @Inject annotation (string)', () => {
            const instance = getInstance();

            instance
                .register(GeographyTeacher)
                .register(GeographyStudent, { tokens: ['geography-student'] })
                .registerParamForTokenInjection('geography-student', GeographyTeacher, 0);

            const geographyTeacher = instance.get(GeographyTeacher);

            expect(geographyTeacher).toBeDefined();
            expect(geographyTeacher.student).toBeDefined();
            expect(geographyTeacher.student instanceof GeographyStudent).toBeTruthy();
        });

        it('should resolve the correct instance based on the token defined in the @Inject annotation (symbol)', () => {
            const instance = getInstance();

            const symbol = Symbol.for('geography-student');

            instance
                .register(GeographyTeacher)
                .register(GeographyStudent, { tokens: [symbol] })
                .registerParamForTokenInjection(symbol, GeographyTeacher, 0);

            const geographyTeacher = instance.get(GeographyTeacher);

            expect(geographyTeacher).toBeDefined();
            expect(geographyTeacher.student).toBeDefined();
            expect(geographyTeacher.student instanceof GeographyStudent).toBeTruthy();
        });

        it('should resolve an instance of the type using multiple tokens', () => {
            const instance = getInstance();

            const symbol = Symbol.for('daughter');

            instance.register(Child, {
                tokens: ['child', 'son', symbol],
            });

            const child = instance.get<typeof Child>('child');
            const son = instance.get<typeof Child>('son');
            const daughter = instance.get<typeof Child>(symbol);

            expect(child).toBeDefined();
            expect(son).toBeDefined();
            expect(daughter).toBeDefined();

            expect(child).toBe(son);
            expect(daughter).toBe(son);
        });

        it('should throw an error if we try and register two types sharing the same String token and allowDuplicateTokens=false.', () => {
            const instance = getInstance();

            instance.configuration.allowDuplicateTokens = false;
            let message = '';

            instance.register(Child, {
                tokens: ['child'],
            });

            try {
                instance.register(Parent, {
                    tokens: ['child'],
                });
            } catch (ex) {
                message = (ex as any).message;
            }

            expect(message).toBe(
                "Cannot register Type [Parent] with token 'child'. Duplicate token found for the following type [Child]",
            );
        });

        it('should throw an error if we try and register two types sharing the same Symbol token and allowDuplicateTokens=false.', () => {
            const instance = getInstance();

            const symbol = Symbol.for('child');
            instance.configuration.allowDuplicateTokens = false;
            let message = '';

            instance.register(Child, {
                tokens: [symbol],
            });

            try {
                instance.register(Parent, {
                    tokens: [symbol],
                });
            } catch (ex) {
                message = (ex as any).message;
            }

            expect(message).toBe(
                "Cannot register Type [Parent] with token 'Symbol(child)'. Duplicate token found for the following type [Child]",
            );
        });

        it('should resolve an instance of the type using the last registered type against the token when configuration allowDuplicateTokens=true.', () => {
            const instance = getInstance();

            instance.configuration.allowDuplicateTokens = true;

            instance.register(Child, {
                tokens: ['child'],
            });

            instance.register(Parent, {
                tokens: ['child'],
            });

            const child = instance.get<typeof AdoptedChild>('child');

            expect(child).toBeDefined();
            expect(child instanceof Parent).toBeTruthy();
        });

        it('should throw an error when the token cannot be resolved', () => {
            const instance = getInstance();
            let exception: any;
            try {
                instance.register(Child, {
                    tokens: ['child'],
                });

                instance.get<typeof Child>('unknownChild');
            } catch (ex) {
                exception = ex;
            }

            expect(exception).toBeDefined();
            expect(exception.message).toBe(
                `Cannot resolve Type with token 'unknownChild' as no types have been registered against that token value`,
            );
        });
    });
});
