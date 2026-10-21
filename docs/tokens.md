# Tokens

Tokens allow us to provide a marker to the injector whereby the type we are going to be injecting either cannot be imported or we wish to use an interface instead. Every injectable in the system can be registered with either zero or more tokens. A single type can register itself against multiple tokens. Tokens can be defined using a `string` or `symbol`

## Registering with tokens

The simplest way to register your type against a token is to use the tokens array defined in the `@Injectable` decorator. here we have a type `GeographyStudent` who defines a string `geography-student` upon which this type can be resolved.

```typescript
import { Injectable } from '@morgan-stanley/needle';

@Injectable({
    tokens: ['geography-student'],
})
export class GeographyStudent extends Student {}
```

The API equivalent of this registration is shown below.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().register(GeographyStudent, { tokens: ['geography-student'] });
```

As stated, you are not limited to just one 1 token per type. Simply add additional tokens to the list if you require more.

```typescript
import { Injectable } from '@morgan-stanley/needle';

@Injectable({
    tokens: ['geography-student', 'student'],
})
export class GeographyStudent extends Student {}
```

## Registering Symbols for tokens

Using strings as tokens for most teams is perfectly acceptable, however often in large code bases it is possible to run into naming collisions. In order to resolve this issue you can instead adopt `Symbols` instead to define your tokens. Below is an example of two registrations where the Symbol names overlap but will not pollute each other when resolutions are made as Symbols are unique.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const pricingSymbol1 = Symbol.for('pricing');
const pricingSymbol2 = Symbol.for('pricing');

getRootInjector().configuration.allowDuplicateTokens = false;

getRootInjector()
    .register(PricingServiceV1, { tokens: [pricingSymbol1] })
    .register(PricingServiceV2, { tokens: [pricingSymbol2] }); //No exception thrown as Symbols are unique
```

## Resolving by token

To resolve a type by token we can make use of the `@Inject` decorator. In the constructor of a given injectable we can mark one of the parameters with `@Inject` providing a token which we wish to resolve. Note, the parameter type does not need to match the type of the injected value. This is what allows us to use either interfaces or a sub type as a replacement for the real type.

```typescript
@Injectable()
export class GeographyTeacher extends Person {
    constructor(@Inject('geography-student') public student: Student) {
        super();
    }
}
```

The API equivalent of this registration is shown below.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

export class GeographyTeacher extends Person {
    constructor(public student: IStudent) {
        super();
    }
}

const argumentIndex = 0;

getRootInjector()
    .register(GeographyTeacher)
    .registerParamForTokenInjection('geography-student', GeographyTeacher, argumentIndex);
```

## Token overriding

It is often the case that you may want to resolve a different type instance as a replacement for say a default one. For example, say you have a Pricing service which for new customers you want to use the new pricing models but for existing customers you will use the old pricing model.

Using token injection we follow a last in first out (`LIFO`). Therefore, the last Injectable to be registered to a given token is the one that will be resolved.

_Note: the configuration must be set to `allowDuplicateTokens` for this to be possible._

```typescript
import { getRootInjector, Injectable, METADATA } from '@morgan-stanley/needle';

getRootInjector().configuration.allowDuplicateTokens = true;

@Injectable({ tokens: ['pricing'] })
export class PricingServiceV1 implements IPricing {}

@Injectable({ tokens: ['pricing'] })
export class PricingServiceV2 implements IPricing {}

@Injectable({ metadata: [METADATA.token] })
export class CustomerPricing {
    constructor(@Inject('pricing') private pricing: IPricing) {
        console.log(pricing instanceof PricingServiceV2); // true
        super();
    }
}
```

The API equivalent of this registration is shown below.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.allowDuplicateTokens = true;

const argumentIndex = 0;

getRootInjector()
    .register(PricingServiceV1, { tokens: ['pricing'] })
    .register(PricingServiceV2, { tokens: ['pricing'] })
    .register(CustomerPricing, { metadata: [METADATA.token] })
    .registerParamForTokenInjection('pricing', CustomerPricing, argumentIndex);
```

## Unique token enforcement

If you wish to restrict duplicate tokens in the system you can control this using the configuration. _Note, the default is already set to `false`._

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

getRootInjector().configuration.allowDuplicateTokens = false;

getRootInjector()
    .register(PricingServiceV1, { tokens: ['pricing'] })
    //Exception thrown here
    .register(PricingServiceV2, { tokens: ['pricing'] });
```
