/**
 * Lazy type is used to resolve a given instance at point of use.
 */
export class LazyInstance<T> {
    private _value!: T;
    private _hasValue = false;

    constructor(private factory: () => T) {}

    public get hasValue(): boolean {
        return this._hasValue;
    }

    public get value(): T {
        return this.getValue();
    }

    private getValue(): T {
        if (!this._hasValue) {
            this._value = this.factory();
            this._hasValue = true;
        }
        return this._value;
    }
}
