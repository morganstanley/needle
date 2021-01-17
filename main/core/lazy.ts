import { InstanceOfType } from '../contracts/contracts';

/**
 * Lazy type is used to resolve a given instance at point of use.
 */
export class LazyInstance<T> {
    private _value!: InstanceOfType<T>;
    private _hasValue = false;

    constructor(private factory: () => InstanceOfType<T>) {}

    public get hasValue(): boolean {
        return this._hasValue;
    }

    public get value(): InstanceOfType<T> {
        return this.getValue();
    }

    private getValue(): InstanceOfType<T> {
        if (!this._hasValue) {
            this._value = this.factory();
            this._hasValue = true;
        }
        return this._value;
    }
}
