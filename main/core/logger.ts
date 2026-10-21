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

let currentLogger: ILogger = consoleLogger;

/**
 * Replaces the logger used by Needle
 */
export function setLogger(logger: ILogger): void {
    currentLogger = logger;
}

/**
 * Restores the default console logger
 */
export function resetLogger(): void {
    currentLogger = consoleLogger;
}

/**
 * Gets the logger currently used by Needle
 */
export function getLogger(): ILogger {
    return currentLogger;
}
