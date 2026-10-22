import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DUAL_FORMAT_WARNING, NEEDLE_LOADED_FORMATS_KEY, registerLoadedFormat } from './loaded-formats.js';
import { ILogger, resetLogger, setLogger } from './logger.js';
import { NEEDLE_MODULE_FORMAT } from './module-format.js';

describe('loaded module formats', () => {
    const host = globalThis as unknown as Record<symbol, unknown>;
    let saved: unknown;
    let logger: ILogger;

    beforeEach(() => {
        saved = host[NEEDLE_LOADED_FORMATS_KEY];
        delete host[NEEDLE_LOADED_FORMATS_KEY];
        logger = { warn: vi.fn(), log: vi.fn() };
        setLogger(logger);
    });

    afterEach(() => {
        host[NEEDLE_LOADED_FORMATS_KEY] = saved;
        resetLogger();
    });

    it('source constant is esm (the cjs build stamps cjs)', () => {
        expect(NEEDLE_MODULE_FORMAT).toBe('esm');
    });

    it('does not warn for a single copy, even if loaded repeatedly', () => {
        registerLoadedFormat('esm');
        registerLoadedFormat('esm');
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('warns once when both ESM and CommonJS are loaded', () => {
        registerLoadedFormat('esm');
        registerLoadedFormat('cjs');
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(DUAL_FORMAT_WARNING);
    });

    it('does not warn again when more copies load', () => {
        registerLoadedFormat('cjs');
        registerLoadedFormat('esm');
        registerLoadedFormat('esm');
        registerLoadedFormat('cjs');
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('records formats on globalThis so every copy shares the slot', () => {
        registerLoadedFormat('esm');
        expect(host[NEEDLE_LOADED_FORMATS_KEY]).toEqual({ formats: ['esm'], warned: false });
    });
});
