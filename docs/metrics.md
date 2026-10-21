# Metrics tracking

The injector tracks metrics about your injectable types during runtime. There are a range of different values captured and these are stored in the metrics provider which is accessible via the Injector type. The data is store as records and the below type shows the information captured.

```typescript
export interface IMetricRecord {
    /**
     * The type who's metrics are being tracked
     */
    type: any;
    /**
     * First activation time
     */
    activated: Date;
    /**
     * What type constructed this type. (Defaults to self if bare resolution)
     */
    activationTypeOwner: any;
    /**
     * The number of times this type has been resolved
     */
    resolutionCount: number;
    /**
     * The last time this type resolved
     */
    lastResolution: Date;
    /**
     * The number of types this type depends on based on constructor signature.
     */
    dependencyCount: number;
    /**
     * The time it took to construct this type
     */
    creationTimeMs: number;
}
```

## Reading the metric data

There are a number of ways to read the metric data. To access via the injector instance simply do the following.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const metrics = getRootInjector().metrics;
```

You can easily `dump` the data to the console using the following.

```typescript
getRootInjector().metrics.dump();
```

You can reset the metrics by calling the `reset` method.

```typescript
getRootInjector().metrics.reset();
```

You read the metrics for a specific type by using the `getMetricsForType` method.

```typescript
getRootInjector().metrics.getMetricsForType(MyType);
```

You an read all the metric data by reading the `data` property.

```typescript
const records: IMetricRecord[] = getRootInjector().metrics.data;
```
