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
