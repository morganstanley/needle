import { afterEach, describe, expect, it, vi } from 'vitest';
import { Injector } from './injector.js';
import { consoleLogger, getLogger, ILogger, resetLogger, setLogger } from './logger.js';
import { Metrics } from './metrics.js';

describe('logger', () => {
    afterEach(() => {
        resetLogger();
        vi.restoreAllMocks();
    });

    it('defaults to the console logger', () => {
        expect(getLogger()).toBe(consoleLogger);
        const table = vi.spyOn(console, 'table').mockImplementation(() => undefined);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        new Metrics().dump();
        consoleLogger.warn('w', 1);
        consoleLogger.log('l');
        expect(table).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith('w', 1);
        expect(log).toHaveBeenCalledWith('l');
    });

    it('falls back to console.log when console.table is missing', () => {
        const original = console.table;
        (console as any).table = undefined;
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        try {
            consoleLogger.table!([1]);
        } finally {
            console.table = original;
        }
        expect(log).toHaveBeenCalledWith([1]);
    });

    it('routes metrics dumps through a custom logger (log when no table)', () => {
        const logger: ILogger = { warn: vi.fn(), log: vi.fn() };
        setLogger(logger);
        new Metrics().dump();
        expect(logger.log).toHaveBeenCalledWith([]);
    });

    it('routes cache predicate failures through a custom logger', () => {
        const logger: ILogger = { warn: vi.fn(), log: vi.fn(), table: vi.fn() };
        setLogger(logger);
        const injector = Injector.create();
        class Thing {}
        injector.register(Thing, {
            cacheStrategy: {
                type: 'conditional',
                predicate: () => {
                    throw new Error('boom');
                },
            } as any,
        });
        injector.get(Thing);
        injector.cache.purge();
        expect(logger.warn).toHaveBeenCalled();
    });
});
