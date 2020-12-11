import { ICache, Newable } from '../contracts/contracts';

export class InstanceCache implements ICache {
    private instanceMap = new Map<any, any>();

    public resolve<T extends Newable>(type: T): InstanceType<T> {
        return this.instanceMap.get(type);
    }

    public update(type: any, instance: any): void {
        this.instanceMap.set(type, instance);
    }

    public clear(): void {
        this.instanceMap.clear();
    }

    public get instanceCount(): number {
        return this.instanceMap.size;
    }
}
