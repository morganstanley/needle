import { getGlobal } from './globals.js';
import { getLogger } from './logger.js';

/**
 * Key of the shared slot on the host global that records which module formats of Needle have been loaded.
 */
export const NEEDLE_LOADED_FORMATS_KEY = Symbol.for('needle.morganstanley.com.loaded-formats');

export const DUAL_FORMAT_WARNING =
    'Needle has been loaded as both ESM and CommonJS. State is shared, but instanceof checks on Needle classes ' +
    '(e.g. NeedleError) will not match across copies; use error.code instead.';

interface ILoadedFormats {
    formats: string[];
    warned: boolean;
}

/**
 * Records that a copy of Needle in the given format has loaded. Warns once per process (via the Needle logger)
 * the first time a second, different format is seen.
 * @internal
 */
export function registerLoadedFormat(format: string): void {
    const host = getGlobal();
    let state = host[NEEDLE_LOADED_FORMATS_KEY] as ILoadedFormats | undefined;
    if (state == null) {
        state = { formats: [], warned: false };
        host[NEEDLE_LOADED_FORMATS_KEY] = state;
    }
    if (!state.formats.includes(format)) {
        state.formats.push(format);
    }
    if (!state.warned && state.formats.length > 1) {
        state.warned = true;
        getLogger().warn(DUAL_FORMAT_WARNING);
    }
}
