import { getGlobal, IGlobalReference } from './globals.js';

/**
 * Minimal logging contract used by Needle for diagnostics.
 * Provide your own implementation with {@link setLogger} to route Needle's output to your logging framework.
 */
export interface ILogger {
    /**
     * Called when Needle recovers from a problem (for example a cache predicate that throws)
     */
    warn(message: string, ...args: unknown[]): void;
    /**
     * Called to output general information (for example when metrics are dumped and no table support exists)
     */
    log(message: unknown, ...args: unknown[]): void;
    /**
     * Optional tabular output (used by `metrics.dump()`). When absent, `log` is used instead.
     */
    table?(data: unknown): void;
}

/**
 * The default logger. Writes to the global `console` (looked up at call time so test spies and patched consoles work).
 */
export const consoleLogger: ILogger = {
    warn: (message, ...args) => console.warn(message, ...args),
    log: (message, ...args) => console.log(message, ...args),
    table: (data) => (typeof console.table === 'function' ? console.table(data) : console.log(data)),
};

/**
 * Key of the shared logger slot on the host global. Using `Symbol.for` means every copy of Needle loaded in the
 * process (for example the ESM and CommonJS builds side by side) reads and writes the same slot.
 */
const NEEDLE_LOGGER_KEY = Symbol.for('needle.morganstanley.com.logger');

function slot(): IGlobalReference {
    return getGlobal();
}

/**
 * Replaces the logger used by Needle
 */
export function setLogger(logger: ILogger): void {
    slot()[NEEDLE_LOGGER_KEY] = logger;
}

/**
 * Restores the default console logger
 */
export function resetLogger(): void {
    delete slot()[NEEDLE_LOGGER_KEY];
}

/**
 * Gets the logger currently used by Needle
 */
export function getLogger(): ILogger {
    return (slot()[NEEDLE_LOGGER_KEY] as ILogger | undefined) ?? consoleLogger;
}
