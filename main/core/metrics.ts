import { getLogger } from './logger.js';
import { IMetricRecord, IMetricsProvider } from '../contracts/contracts.js';
import { getConstructorTypes } from './metadata.functions.js';

export class Metrics implements IMetricsProvider {
    public get data() {
        return Array.from(this._metrics).map(([_item, value]) => value);
    }
    private _metrics = new Map<unknown, IMetricRecord>();

    public clear(): void {
        this._metrics.clear();
    }

    public getMetricsForType(type: unknown): Readonly<IMetricRecord> | undefined {
        return this._metrics.get(type);
    }

    public dump(): void {
        const logger = getLogger();
        if (logger.table) {
            logger.table(this.data);
        } else {
            logger.log(this.data);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic type, cannot be narrowed without breaking callers
    public update(type: any, owner: any, creationTimeMs: number): void {
        // First time init lets create a record
        if (!this._metrics.has(type)) {
            this._metrics.set(type, {
                name: type.name,
                activated: new Date(),
                activationTypeOwner: owner || type,
                creationTimeMs,
                dependencyCount: getConstructorTypes(type).length,
                lastResolution: new Date(),
                resolutionCount: 0,
                type,
            });
        }

        const record = this._metrics.get(type);
        // Lets update the values that matter
        if (record != null) {
            record.lastResolution = new Date();
            record.resolutionCount++;
        }
    }
}
