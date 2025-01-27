import { generateUUID } from '../core/uuid';
import { getRootInjector } from '../core/util.functions';

/**
 * The @Optional annotation allows you signal to the injector that you are ok with an undefined value if the type has not been registered with the injector
 *
 * constructor(@Optional() thing?: Thing) {}
 */
export function Optional() {
    // the original decorator
    function optional(target: any, property: string | symbol | undefined, index: number): void {
        getRootInjector().tokenCache.register({
            token: `optional_${generateUUID()}`,
            owner: target,
            property,
            index,
            injectionType: 'optional',
        });
    }

    // return the decorator
    return optional;
}
