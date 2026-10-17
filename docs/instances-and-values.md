# Register instance

There are sometimes where you do not want the injection container to create the type. Instead you want to take an already existing instance and register it against a type. For this you can use `registerInstance` on the injector.

```typescript
import { getRootInjector } from '@morgan-stanley/needle';

const vehicle = new Vehicle('Bike');

getRootInjector().registerInstance(Vehicle, vehicle);

const instance = get(Vehicle);

console.log(instance === vehicle); // True
```

# Register Value

JavaScript has a number of intrinsic types that you may wish to inject directly into a constructor without the need for wrapping in a higher type. These types include `Array`, `Boolean`, `Date`, `Error`, `Function`, `JSON`, `Number`, `RegExp` and `String`. In order to support direct injection of these types we can use the `registerValue` method found on the injector. The `registerValue` method only takes one parameter, the injection configuration object. There are two ways to resolve the value, you can either provide a value at point of registration or you can use a resolution strategy to resolve at point of use. Below are some examples to illustrate how this works.

## Registering with a AOT value

```typescript
@Injectable()
class SecurityContext {
    constructor(@Inject('security-token') public securityToken: string) {}
}

// Tokens are used the same as for other types.
getRootInjector().registerValue<string>({
    tokens: ['security-token'],
    value: 'TmVlZGxlIFByb2plY3Q=',
});
```

## Registering with a JIT computed value value

```typescript
getRootInjector().registerValue<string>({
    tokens: ['security-token'],
    value: {
        cacheSyncing: true,
        resolver: (_injector) => Encryption.resolveUserContextToken(),
    },
});
```

If you want the value to mutate on each request, you can set `cacheSyncing` to false.

**Note**: As values have no associated type upon which to decorate, you can only use the Injector API to register values.
