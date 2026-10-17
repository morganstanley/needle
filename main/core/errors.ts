const formatAncestry = (ancestry: ReadonlyArray<unknown>): string =>
    ancestry.map((ancestor) => (ancestor as { name?: string } | undefined)?.name ?? String(ancestor)).join(' -> ');

const withPath = (message: string, path: ReadonlyArray<string>): string =>
    path.length > 0 ? `${message} (resolution path: ${path.join(' -> ')})` : message;

/**
 * Base class for every error thrown by Needle. Use `instanceof NeedleError` or the `code` to handle them.
 */
export class NeedleError extends Error {
    constructor(
        message: string,
        public readonly code: string,
    ) {
        super(message);
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Base class for errors raised while resolving a type; carries the path of types being resolved.
 */
export class ResolutionError extends NeedleError {
    /**
     * Names of the types that were being resolved, outermost first
     */
    public readonly resolutionPath: ReadonlyArray<string>;

    constructor(message: string, code: string, ancestry: ReadonlyArray<unknown> = [], appendPath = false) {
        const path = ancestry.map((a) => (a as { name?: string } | undefined)?.name ?? String(a));
        super(appendPath ? withPath(message, path) : message, code);
        this.resolutionPath = path;
    }
}

/**
 * Thrown when a type is requested that no injector has a registration for
 */
export class TypeNotRegisteredError extends ResolutionError {
    constructor(
        public readonly typeName: string | undefined,
        ancestry: ReadonlyArray<unknown> = [],
    ) {
        super(
            `Cannot construct Type '${typeName}' with ancestry '${formatAncestry(ancestry)}' the type is either not decorated with @Injectable or injector.register was not called for the type or the constructor param is not marked @Optional`,
            'NEEDLE_TYPE_NOT_REGISTERED',
            ancestry,
        );
    }
}

/**
 * Thrown when a type or token cannot be found on any injector
 */
export class NotResolvableError extends ResolutionError {
    constructor(
        public readonly typeOrToken: unknown,
        ancestry: ReadonlyArray<unknown> = [],
        public readonly isToken = false,
    ) {
        super(
            isToken
                ? `Cannot resolve Type with token '${String(typeOrToken)}' as no types have been registered against that token value`
                : `Cannot resolve Type '${(typeOrToken as { name?: string } | undefined)?.name}' as no types have been registered against any injectors`,
            'NEEDLE_NOT_RESOLVABLE',
            ancestry,
            true,
        );
    }
}

/**
 * Thrown when the dependency graph is deeper than `configuration.maxTreeDepth` (usually a circular dependency)
 */
export class MaxDepthExceededError extends ResolutionError {
    constructor(
        public readonly typeName: string | undefined,
        ancestry: ReadonlyArray<unknown>,
    ) {
        super(
            `Cannot construct Type '${typeName}' with ancestry '${formatAncestry(ancestry)}' as max tree depth has been reached`,
            'NEEDLE_MAX_DEPTH_EXCEEDED',
            ancestry,
        );
    }
}

/**
 * Thrown when an operation is attempted on an injector that has been destroyed
 */
export class InjectorDestroyedError extends NeedleError {
    constructor(public readonly injectorId: string) {
        super(
            `Invalid operation, the current injector instance is marked as destroyed. Injector Id: [${injectorId}]`,
            'NEEDLE_INJECTOR_DESTROYED',
        );
    }
}

/**
 * Thrown when registering a type against a token that is already taken (and duplicates are not allowed)
 */
export class DuplicateTokenError extends NeedleError {
    constructor(
        public readonly typeName: string | undefined,
        public readonly token: string | symbol,
        existingTypeNames: ReadonlyArray<string | undefined>,
    ) {
        super(
            `Cannot register Type [${typeName}] with token '${token.toString()}'. Duplicate token found for the following type [${existingTypeNames.join(' -> ')}]`,
            'NEEDLE_DUPLICATE_TOKEN',
        );
    }
}

/**
 * Thrown when a value is registered without any token to look it up by
 */
export class MissingValueTokenError extends NeedleError {
    constructor() {
        super('All values must be registered with a given token', 'NEEDLE_MISSING_VALUE_TOKEN');
    }
}
