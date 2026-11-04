import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    multipleInstancesMessage,
    NEEDLE_ALLOW_MULTIPLE_INSTANCES_KEY,
    NEEDLE_INSTANCES_KEY,
    registerNeedleInstance,
} from './instance-guard.js';
import { ILogger, resetLogger, setLogger } from './logger.js';
import './injector.js';
import { getRootInjector } from './util.functions.js';
import { NEEDLE_VERSION } from './version.js';

describe('multiple Needle instance guard', () => {
    const host = globalThis as unknown as Record<symbol, unknown>;
    let saved: unknown;
    let logger: ILogger;

    beforeEach(() => {
        saved = host[NEEDLE_INSTANCES_KEY];
        delete host[NEEDLE_INSTANCES_KEY];
        delete host[NEEDLE_ALLOW_MULTIPLE_INSTANCES_KEY];
        logger = { warn: vi.fn(), log: vi.fn() };
        setLogger(logger);
    });

    afterEach(() => {
        host[NEEDLE_INSTANCES_KEY] = saved;
        delete host[NEEDLE_ALLOW_MULTIPLE_INSTANCES_KEY];
        getRootInjector().configuration.allowMultipleInstances = false;
        resetLogger();
    });

    it('NEEDLE_VERSION matches package.json', () => {
        const pkg = JSON.parse(readFileSync(`${process.cwd()}/package.json`, 'utf8'));
        expect(NEEDLE_VERSION).toBe(pkg.version);
    });

    it('allows a single instance', () => {
        expect(() => registerNeedleInstance({ version: '1.0.0', format: 'esm' })).not.toThrow();
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('allows the ESM and CJS builds of the same version (dual format, handled separately)', () => {
        registerNeedleInstance({ version: '1.0.0', format: 'esm' });
        expect(() => registerNeedleInstance({ version: '1.0.0', format: 'cjs' })).not.toThrow();
    });

    it('throws when two different versions are loaded, naming both', () => {
        registerNeedleInstance({ version: '0.3.38', format: 'cjs' });
        expect(() => registerNeedleInstance({ version: '1.0.0', format: 'esm' })).toThrow(
            /Multiple copies of @morgan-stanley\/needle .* not supported[\s\S]*0\.3\.38 \(cjs\) and 1\.0\.0 \(esm\)/,
        );
    });

    it('throws when the same version is loaded twice in the same format', () => {
        registerNeedleInstance({ version: '1.0.0', format: 'esm' });
        expect(() => registerNeedleInstance({ version: '1.0.0', format: 'esm' })).toThrow(
            /same version \(1\.0\.0\) has been loaded twice/,
        );
    });

    it('message explains the impact, the fix and the opt-out', () => {
        const msg = multipleInstancesMessage({ version: '0.3.38', format: 'esm' }, { version: '1.0.0', format: 'esm' });
        expect(msg).toContain('https://morganstanley.github.io/needle/#/guide/multiple-instances');
        expect(msg).toContain('dependency injection');
        expect(msg).toContain('npm dedupe');
        expect(msg).toContain('overrides');
        expect(msg).toContain('resolutions');
        expect(msg).toContain('allowMultipleInstances = true');
        expect(msg).toContain('needle.morganstanley.com.allow-multiple-instances');
    });

    it('configuration.allowMultipleInstances downgrades the error to a warning', () => {
        getRootInjector().configuration.allowMultipleInstances = true;
        registerNeedleInstance({ version: '0.3.38', format: 'esm' });
        expect(() => registerNeedleInstance({ version: '1.0.0', format: 'esm' })).not.toThrow();
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(vi.mocked(logger.warn).mock.calls[0][0]).toContain('not supported');
    });

    it('the global opt-out flag downgrades the error to a warning', () => {
        host[NEEDLE_ALLOW_MULTIPLE_INSTANCES_KEY] = true;
        registerNeedleInstance({ version: '1.0.0', format: 'esm' });
        expect(() => registerNeedleInstance({ version: '1.0.0', format: 'esm' })).not.toThrow();
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });
});
