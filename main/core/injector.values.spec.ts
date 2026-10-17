/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { beforeEach, describe, expect, it } from 'vitest';
import { Payload, SecurityToken, getInstance, installFreshRootInjector } from '../../spec/injector.fixtures.js';

describe('Injector', () => {
    beforeEach(() => {
        installFreshRootInjector();
    });

    describe('Values', () => {
        it('should throw and error if no tokens provided', () => {
            const instance = getInstance();
            let error: any;

            try {
                instance.registerValue<string>({
                    tokens: [],
                    value: 'myvalue',
                });
            } catch (ex) {
                error = ex;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe('All values must be registered with a given token');
        });

        it('should register and resolve the value of type [String]', () => {
            const instance = getInstance();

            instance.registerValue<string>({
                tokens: ['mystring'],
                value: 'myvalue',
            });

            const value = instance.get('mystring');

            expect(value).toBeDefined();
            expect(value).toBe('myvalue');
        });

        it('should register and resolve the value of type [Number]', () => {
            const instance = getInstance();

            instance.registerValue<number>({
                tokens: ['answer-to-everything'],
                value: 42,
            });

            const value = instance.get<number>('answer-to-everything');

            expect(value).toBeDefined();
            expect(value).toBe(42);
        });

        it('should register and resolve the value of type [Date]', () => {
            const instance = getInstance();

            instance.registerValue<Date>({
                tokens: ['battle-of-hastings'],
                value: new Date('14 Oct 1066'),
            });

            const value = instance.get<Date>('battle-of-hastings');

            expect(value).toBeDefined();
            expect(value.getDate()).toBe(14);
            expect(value.getMonth()).toBe(9);
            expect(value.getFullYear()).toBe(1066);
        });

        it('should register and resolve the value of type [Function]', () => {
            const instance = getInstance();

            let invoked = false;

            instance.registerValue<Function>({
                tokens: ['my-func'],
                value: () => (invoked = true),
            });

            const value = instance.get<Function>('my-func');
            value();

            expect(typeof value === 'function').toBeTruthy();
            expect(invoked).toBeTruthy();
        });

        it('should register and resolve the value of type [Boolean]', () => {
            const instance = getInstance();

            instance.registerValue<boolean>({
                tokens: ['flag'],
                value: true,
            });

            const value = instance.get<boolean>('flag');

            expect(value).toBeTruthy();
        });

        it('should register and resolve the value of type [RegEx]', () => {
            const instance = getInstance();

            instance.registerValue<RegExp>({
                tokens: ['regular-expression'],
                value: new RegExp('@'),
            });

            const value = instance.get<RegExp>('regular-expression');

            expect(value).toBeDefined();
        });

        it('should register and resolve the value of type [Error]', () => {
            const instance = getInstance();

            instance.registerValue<Error>({
                tokens: ['error-token'],
                value: new Error('oops'),
            });

            const value = instance.get<Error>('error-token');

            expect(value).toBeDefined();
            expect(value.message).toBe('oops');
        });

        it('should register and resolve the value of type [Array]', () => {
            const instance = getInstance();

            instance.registerValue<Array<any>>({
                tokens: ['array-token'],
                value: [1, 2, 3],
            });

            const value = instance.get<Array<any>>('array-token');

            expect(value).toBeDefined();
            expect(value).toEqual([1, 2, 3]);
        });

        it('should register and resolve the value of type [JSON]', () => {
            const instance = getInstance();
            const jsonData = {
                name: 'test',
            };

            instance.registerValue<object>({
                tokens: ['json-token'],
                value: jsonData,
            });

            const value = instance.get<object>('json-token');

            expect(value).toBeDefined();
            expect(value).toBe(jsonData);
        });

        it('should use the resolver config if provided to resolve the value', () => {
            const instance = getInstance();

            instance.registerValue<string>({
                tokens: ['value-1'],
                value: {
                    cacheSyncing: true,
                    resolver: (_injector) => 'my-test',
                },
            });

            const value = instance.get<string>('value-1');

            expect(value).toBe('my-test');
        });

        it('should use the resolver config if provided to resolve the value', () => {
            const instance = getInstance();
            const regex = new RegExp('@');

            instance.registerValue<RegExp>({
                tokens: ['value-1'],
                value: {
                    cacheSyncing: true,
                    resolver: (_injector) => regex,
                },
            });

            const value = instance.get<RegExp>('value-1');

            expect(value).toBe(regex);
        });

        it('should regenerate the value if the resolver config does not enable caching', () => {
            const instance = getInstance();

            let counter = 0;

            instance.registerValue<number>({
                tokens: ['value-1'],
                value: {
                    cacheSyncing: false,
                    resolver: (_injector) => ++counter,
                },
            });

            const value1 = instance.get<number>('value-1');
            const value2 = instance.get<number>('value-1');
            const value3 = instance.get<number>('value-1');

            expect(value1).toBe(1);
            expect(value2).toBe(2);
            expect(value3).toBe(3);
        });

        it('should register multiple values and resolve each without issue', () => {
            const instance = getInstance();

            instance.registerValue<boolean>({
                tokens: ['value-1'],
                value: true,
            });

            instance.registerValue<string>({
                tokens: ['value-2'],
                value: 'my-test',
            });

            instance.registerValue<number>({
                tokens: ['value-3'],
                value: 13,
            });

            const value1 = instance.get<boolean>('value-1');
            const value2 = instance.get<string>('value-2');
            const value3 = instance.get<number>('value-3');

            expect(value1).toBe(true);
            expect(value2).toBe('my-test');
            expect(value3).toBe(13);
        });

        it('should inject the value into parent type [string]', () => {
            const instance = getInstance();

            instance
                .register(SecurityToken)
                .registerParamForTokenInjection('raw-token', SecurityToken, 0)
                .registerValue<string>({
                    tokens: ['raw-token'],
                    value: 'ABDCEF-12345',
                });

            const securityToken = instance.get(SecurityToken);

            expect(securityToken).toBeDefined();
            expect(securityToken.rawToken).toBe('ABDCEF-12345');
        });

        it('should inject the value into parent type [object]', () => {
            const instance = getInstance();
            const jsonData = {
                test: 'data',
            };

            instance
                .register(Payload)
                .registerParamForTokenInjection('data-token', Payload, 0)
                .registerValue<object>({
                    tokens: ['data-token'],
                    value: jsonData,
                });

            const payload = instance.get(Payload);

            expect(payload).toBeDefined();
            expect(payload.jsonData).toBe(jsonData);
        });

        it('should throw an error if value registered twice under same token and allowDuplicateTokens not enabled', () => {
            const instance = getInstance();
            let error: any;

            instance.registerValue<string>({
                tokens: ['my-value'],
                value: 'my-test-value',
            });

            try {
                instance.registerValue<string>({
                    tokens: ['my-value'],
                    value: 'another value',
                });
            } catch (ex) {
                error = ex;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe(
                `Cannot register Type [Type] with token 'my-value'. Duplicate token found for the following type [Type]`,
            );
        });
    });
});
