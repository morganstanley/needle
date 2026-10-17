import { IInjector } from '../../contracts/contracts.js';
import { isStringOrSymbol } from '../guards.js';
import type { Injector } from '../injector.js';

/**
 * Walks up the tree of scopes and returns the root injector
 */
export function getRootInjector(injector: Injector): Injector {
    let current: Injector = injector;
    while (current.isRoot() === false) {
        current = current.parent! as Injector;
    }
    return current;
}

/**
 * Breadth-first search of the child scopes for a scope with the given name or id
 */
export function findScope(injector: IInjector, nameOrId: string): IInjector | undefined {
    const queue = [...injector.children.values()];
    while (queue.length > 0) {
        const child = queue.shift()!;
        if (child.id === nameOrId || child.name === nameOrId) {
            return child;
        }

        child.children.forEach((nestedChild) => queue.push(nestedChild));
    }

    return undefined;
}

/**
 * Resolves the closest injector on the tree (starting at `injector`) that can handle a type or token based on registrations.
 * Falls back to `fallback` when no injector knows about it.
 */
export function findInjectorForTypeOrToken(injector: IInjector, tokenOrType: any, fallback: Injector): Injector {
    const isType = !isStringOrSymbol(tokenOrType);
    let current = injector as Injector | undefined;

    while (current != null) {
        const found = isType
            ? current.getRegistrationForType(tokenOrType)
            : current.tokenCache.getTypeForToken(tokenOrType);

        if (found != null) {
            return current;
        }
        current = current.parent as Injector | undefined;
    }

    return fallback;
}
