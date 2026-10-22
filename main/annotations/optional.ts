import { generateUUID } from '../core/uuid.js';
import { getRootInjector } from '../core/util.functions.js';
import {
    assertInjectionTarget,
    createInjectionDecorator,
    IInjectionDecorator,
    InjectionTarget,
    resolveOptional,
} from './decorator-support.js';

/**
 * The @Optional annotation allows you signal to the injector that you are ok with an undefined value if the type has not been registered with the injector
 *
 * constructor(@Optional() thing?: Thing) {}              // legacy parameter decorator
 * @Optional(Thing) accessor thing?: Thing;                // standard field / accessor (target is required)
 */
export function Optional(target?: InjectionTarget): IInjectionDecorator {
    if (target !== undefined) {
        assertInjectionTarget(target, 'Optional');
    }
    return createInjectionDecorator(
        'Optional',
        (owner, property, index) => {
            getRootInjector().tokenCache.register({
                token: `optional_${generateUUID()}`,
                owner,
                property: property as string | symbol,
                index,
                injectionType: 'optional',
            });
        },
        target === undefined ? undefined : resolveOptional(target),
        target,
    );
}
