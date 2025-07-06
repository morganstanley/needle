import { ICache, IInjectionConfiguration, InstanceOfType } from '../contracts/contracts';
import { isConditionalCacheStrategy, isDestroyable, isIdleCacheStrategy } from './guards';
import { getRootInjector } from './util.functions';

export class InstanceCache implements ICache {
    private instanceMap = new Map<any, any>();
    private scheduledEvictionList = new Map<any, { timeout: number; timeoutRef: any }>();

    public resolve<T>(type: T): InstanceOfType<T> {
        let instance = this.instanceMap.get(type);
        if (instance instanceof WeakRef) {
            instance = instance.deref();
        }

        //We must check to see if this instance has an existing eviction time and if so we must reschedule it
        const scheduledEviction = this.scheduledEvictionList.get(type);
        if (scheduledEviction) {
            this.scheduleEviction(type, scheduledEviction.timeout);
        }

        return instance;
    }

    public update(type: any, instance: any, configuration?: IInjectionConfiguration): void {
        const cacheStrategy = configuration?.cacheStrategy ?? getRootInjector().configuration.defaultCacheStrategy;
        const previous = this.resolve(type);
        let cacheValue = instance;

        //If we are not caching this type then we simply return
        if (cacheStrategy === 'no-cache') {
            return;
        } else if (cacheStrategy === 'weak-reference') {
            cacheValue = new WeakRef(instance);
        } else if (isIdleCacheStrategy(cacheStrategy)) {
            this.scheduleEviction(type, cacheStrategy.timeout);
        } else if (isConditionalCacheStrategy(cacheStrategy)) {
            //Todo
        }

        if (previous && previous !== instance) {
            //If we are going to purge from the cache we must check to see if the type implements IDestroyable and then invoke as needed
            this.tryDestroy(previous);
        }

        this.instanceMap.set(type, cacheValue);
    }

    /**
     *  Schedules an eviction for a given type after a specified idle time
     * @param type
     * @param timeout
     */
    public scheduleEviction(type: any, timeout: number) {
        //we must clear any existing timer for this type before we set a new one
        this.tryUnscheduleEviction(type);

        const timer = setTimeout(() => {
            this.evict(type);
        }, timeout);

        //Add the timer to the scheduled eviction list
        //This allows us to clear the timer if needed before it fires
        this.scheduledEvictionList.set(type, { timeout: timeout, timeoutRef: timer });
    }

    /**
     * Unschedule the eviction for a given type
     */
    private tryUnscheduleEviction(type: any) {
        const existingTimer = this.scheduledEvictionList.get(type);
        if (existingTimer) {
            clearTimeout(existingTimer.timeoutRef);
        }
    }

    public clear(): void {
        //Before we purge the cache we must check to see if the type implements IDestroyable and then invoke as needed
        Array.from(this.instanceMap.keys()).forEach((type) => this.evict(type));
    }

    public instances(): Array<any> {
        return Array.from(this.instanceMap.values());
    }

    /**
     * Evicts a type from the cache and destroys it if needed
     * @param type
     */
    private evict(type: any): void {
        const instance = this.resolve(type);
        this.tryUnscheduleEviction(type);
        this.tryDestroy(instance);
        this.instanceMap.delete(type);
    }

    private tryDestroy(instance: any): void {
        if (isDestroyable(instance)) {
            instance.needle_destroy();
        }
    }

    public get instanceCount(): number {
        return this.instanceMap.size;
    }
}
