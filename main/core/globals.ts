declare let global: any;

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
