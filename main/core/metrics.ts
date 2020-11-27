import { GLOBAL_METRICS } from 'main/constants/constants';
import { IMetricRecord, IMetricsProvider } from 'main/contracts/contracts';
import { globalState } from './globals';
import { getConstructorTypes } from './metadata.functions';

export class Metrics implements IMetricsProvider {
    public get data() {
        return Array.from(this._metrics).map(([_item, value]) => value);
    }
    private _metrics = globalState(GLOBAL_METRICS, () => new Map<any, IMetricRecord>());

    public clear(): void {
        this._metrics.clear();
    }

    public getMetricsForType(type: any): Readonly<IMetricRecord> | undefined {
        return this._metrics.get(type);
    }

    public dump(): void {
        if (console.table) {
            console.table(this.data);
        } else {
            console.log(this.data);
        }
    }

    public update(type: any, owner: any, creationTimeMs: number): void {
        // First time init lets create a record
        if (!this._metrics.has(type)) {
            this._metrics.set(type, {
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
