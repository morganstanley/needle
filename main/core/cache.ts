import { ConditionalCacheStrategyType, ICache, IInjectionConfiguration, InstanceOfType } from '../contracts/contracts';
import { isConditionalCacheStrategy, isDestroyable, isIdleCacheStrategy } from './guards';
import { getRootInjector } from './util.functions';

export class InstanceCache implements ICache {
    private instanceMap = new Map<any, any>();
    private scheduled = new Map<any, { timeout: number; timeoutRef: any }>();
    private conditionals = new Map<any, ConditionalCacheStrategyType>();

    public resolve<T>(type: T): InstanceOfType<T> {
        let instance = this.instanceMap.get(type);
        if (instance instanceof WeakRef) {
            instance = instance.deref();
        }

        //We must check to see if this instance has an existing eviction time and if so we must reschedule it
        const scheduledEviction = this.scheduled.get(type);
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
            this.conditionals.set(type, cacheStrategy);
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
        this.scheduled.set(type, { timeout: timeout, timeoutRef: timer });
    }

    /**
     * Unschedule the eviction for a given type
     */
    private tryUnscheduleEviction(type: any) {
        const existingTimer = this.scheduled.get(type);
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
        this.conditionals.delete(type);
    }

    private tryDestroy(instance: any): void {
        if (isDestroyable(instance)) {
            instance.needle_destroy();
        }
    }

    /**
     * Verifies all conditionals in the cache and evicts instances that meet the criteria
     * This is useful for cleaning up instances that are no longer valid based on some condition
     */
    public purge(): void {
        this.conditionals.forEach((strategy, type) => {
            const instance = this.resolve(type);
            if (instance) {
                let result = false;
                try {
                    result = strategy.predicate(instance);
                } catch (e) {
                    console.warn(`Error evaluating predicate for type ${type}:`, e);
                    result = false;
                }
                if (result) {
                    //If the condition is met we must remove the instance from the cache
                    this.evict(type);
                }
            }
        });

        //We must also check for weak references that have been garbage collected
        this.instanceMap.forEach((instance, type) => {
            if (instance instanceof WeakRef) {
                const derefInstance = instance.deref();
                if (!derefInstance) {
                    //If the weak reference has been garbage collected we must remove it from the cache
                    this.evict(type);
                }
            }
        });
    }

    public get instanceCount(): number {
        return this.instanceMap.size;
    }
}
