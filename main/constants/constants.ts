import { Constructor } from '../contracts/contracts';

export const DI_ROOT_INJECTOR_KEY = 'needle.morganstanley.com.root.injector';
export const INJECTOR_TYPE_ID = '5495541b-7416-42a6-a830-065fe591591a';
export const BOXED_TYPE_ID = '5594b0f3-33d2-427a-bada-828e16720436';

/**
 * Represents a null value to the injector so it can discriminate against null
 */
export const NULL_VALUE = { type: 'NULL_VALUE' };

/**
 * Represents a undefined value to the injector so it can discriminate against null
 */
export const UNDEFINED_VALUE = { type: 'UNDEFINED_VALUE' };

/**
 * Represents a type not being found inside of the injector or external injector
 */
export const TYPE_NOT_FOUND = { type: 'TYPE_NOT_FOUND' };

/**
 * This constant can be used in conjunction with AutoFactory
 */
export const AUTO_RESOLVE = undefined;

/**
 * These values are used when defining explicit metadata and you have no type for the parameter being injected as you maybe using annotation.
 *
 * @example @Injectable({metadata: [MyThing, META_DATA.factory, META_DATA.token, META_DATA.strategy]})
 */
export const METADATA = {
    factory: Object as Constructor<any>,
    token: Object as Constructor<any>,
    strategy: Object as Constructor<any>,
};
