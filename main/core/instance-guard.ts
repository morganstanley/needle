import { DI_ROOT_INJECTOR_KEY } from '../constants/constants.js';
import { IInjector } from '../contracts/contracts.js';
import { getGlobal } from './globals.js';
import { getLogger } from './logger.js';

/**
 * Key of the shared slot on the host global that records every copy of Needle loaded in this JavaScript realm.
 */
export const NEEDLE_INSTANCES_KEY = Symbol.for('needle.morganstanley.com.instances');

/**
 * Set `globalThis[NEEDLE_ALLOW_MULTIPLE_INSTANCES_KEY] = true` before any copy of Needle is imported to downgrade
 * the multiple-instance error to a warning. Equivalent to `configuration.allowMultipleInstances = true`, but usable
 * before the root injector exists (e.g. in a setup file or at the top of an entry bundle).
 */
export const NEEDLE_ALLOW_MULTIPLE_INSTANCES_KEY = Symbol.for('needle.morganstanley.com.allow-multiple-instances');

/**
 * Deployed docs page explaining multiple instances, deduping and the override.
 */
export const MULTIPLE_INSTANCES_DOCS_URL = 'https://morganstanley.github.io/needle/#/guide/multiple-instances';

export interface INeedleInstanceInfo {
    version: string;
    format: string;
}

/**
 * Builds the error / warning text for a duplicate copy of Needle.
 * @internal
 */
export function multipleInstancesMessage(existing: INeedleInstanceInfo, incoming: INeedleInstanceInfo): string {
    const versions =
        existing.version === incoming.version
            ? `The same version (${incoming.version}) has been loaded twice (from two separate installs or bundles).`
            : `Versions loaded: ${existing.version} (${existing.format}) and ${incoming.version} (${incoming.format}).`;
    return [
        'Multiple copies of @morgan-stanley/needle have been loaded in the same application. This is not supported.',
        versions,
        'Each copy has its own decorators, metadata and Injector class but they share one global root injector, ' +
            'so registrations, metadata lookups and instanceof checks can silently break and dependency injection ' +
            'may resolve the wrong types or fail.',
        'To fix: make sure only one copy is installed and bundled - run `npm ls @morgan-stanley/needle`, then ' +
            '`npm dedupe`, or pin a single version with package.json "overrides" (npm), "resolutions" (yarn) or ' +
            '"pnpm.overrides" (pnpm), and avoid bundling Needle into more than one bundle (mark it as shared/external).',
        'To opt out (at your own risk): set `getRootInjector().configuration.allowMultipleInstances = true` before ' +
            "the second copy loads, or set `globalThis[Symbol.for('needle.morganstanley.com.allow-multiple-instances')] = true` " +
            'before any copy of Needle is imported. The error then becomes a warning.',
        `More details: ${MULTIPLE_INSTANCES_DOCS_URL}`,
    ].join('\n');
}

function isAllowed(): boolean {
    const host = getGlobal();
    if (host[NEEDLE_ALLOW_MULTIPLE_INSTANCES_KEY] === true) {
        return true;
    }
    const root = host[DI_ROOT_INJECTOR_KEY] as IInjector | undefined;
    return root?.configuration?.allowMultipleInstances === true;
}

/**
 * Records that a copy of Needle has loaded and throws if a different copy is already present.
 * The ESM and CommonJS builds of the *same* version are one install loaded in two formats; that case is handled
 * (with a warning) by `registerLoadedFormat` and is not treated as a duplicate here.
 * @internal
 */
export function registerNeedleInstance(incoming: INeedleInstanceInfo): void {
    const host = getGlobal();
    let instances = host[NEEDLE_INSTANCES_KEY] as INeedleInstanceInfo[] | undefined;
    if (instances == null) {
        instances = [];
        host[NEEDLE_INSTANCES_KEY] = instances;
    }

    const conflict = instances.find(
        (existing) => existing.version !== incoming.version || existing.format === incoming.format,
    );
    instances.push({ ...incoming });

    if (conflict == null) {
        return;
    }

    const message = multipleInstancesMessage(conflict, incoming);
    if (isAllowed()) {
        getLogger().warn(message);
        return;
    }
    throw new Error(message);
}
