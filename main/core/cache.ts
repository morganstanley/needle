import { GLOBAL_INSTANCE_MAP } from '../constants/constants';
import { Newable } from '../contracts/contracts';
import { globalState } from './globals';

/**
 * Instance cache holds all instantiated injectable types.
 */
export class InstanceCache {
    private instanceMap = globalState(GLOBAL_INSTANCE_MAP, () => new Map<any, any>());

    /**
     * Gets an instance from the cache based on the constructor type
     * @param type
     */
    public resolve<T extends Newable>(type: T): InstanceType<T> {
        return this.instanceMap.get(type);
    }

    /**
     * Updates or inserts a record into the instance cache
     * @param type The constructor type
     * @param instance the instance
     */
    public update(type: any, instance: any) {
        this.instanceMap.set(type, instance);
    }

    /**
     * Clears the cache
     */
    public clear(): void {
        this.instanceMap.clear();
    }

    /**
     * Gets the number of instances held in the cache
     */
    public get instanceCount(): number {
        return this.instanceMap.size;
    }
}
