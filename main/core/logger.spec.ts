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

describe('logger shared slot', () => {
    const key = Symbol.for('needle.morganstanley.com.logger');
    const host = globalThis as unknown as Record<symbol, unknown>;

    afterEach(() => resetLogger());

    it('stores the logger on globalThis so every loaded copy of Needle shares it', () => {
        const logger: ILogger = { warn: vi.fn(), log: vi.fn() };
        setLogger(logger);
        expect(host[key]).toBe(logger);
    });

    it('reads a logger written to the shared slot by another copy', () => {
        const logger: ILogger = { warn: vi.fn(), log: vi.fn() };
        host[key] = logger;
        expect(getLogger()).toBe(logger);
    });

    it('falls back to the console logger when the slot is empty', () => {
        delete host[key];
        expect(getLogger()).toBe(consoleLogger);
        setLogger({ warn: vi.fn(), log: vi.fn() });
        resetLogger();
        expect(key in host).toBe(false);
        expect(getLogger()).toBe(consoleLogger);
    });
});
