import { isExternalValueResolutionConfigurationLike } from './guards';
import { IInjector, IBoxedValue } from '../contracts/contracts';
import { BOXED_TYPE_ID } from '../constants/constants';

export function createBoxedValueType() {
    const Type = class implements IBoxedValue {
        public typeId = BOXED_TYPE_ID;
        public value: any;

        constructor(public injector: IInjector, public readonly resolver: any) {}

        public unbox(): any {
            if (this.value == null) {
                if (isExternalValueResolutionConfigurationLike(this.resolver)) {
                    const value = this.resolver.resolver(this.injector);
                    if (this.resolver.cacheSyncing) {
                        this.value = value;
                    } else {
                        return value;
                    }
                } else {
                    this.value = this.resolver;
                }
            }

            return this.value;
        }
    };

    return Type;
}
