import { DI_GLOBAL_STATE_STORE } from '../constants/constants';

declare var global: any;

/**
 * @name getGlobal
 * @description Returns window object in context of browser or global in context of node.
 */
/* istanbul ignore next */
export function getGlobal(): any {
    try {
        return window;
    } catch (e) {
        if (e instanceof ReferenceError) {
            return global;
        }

        throw e;
    }
}

/**
 * Gets a value from global state and if not present uses the default value factory.
 * @description Will initialize default value into the global state value if undefined.
 */
export function globalState<T>(key: string, defaultValue: () => T): T {
    const globalRef = getGlobal();
    if (globalRef[DI_GLOBAL_STATE_STORE] === undefined) {
        globalRef[DI_GLOBAL_STATE_STORE] = {};
    }

    if (globalRef[DI_GLOBAL_STATE_STORE][key] === undefined) {
        globalRef[DI_GLOBAL_STATE_STORE][key] = defaultValue();
    }

    return globalRef[DI_GLOBAL_STATE_STORE][key];
}
