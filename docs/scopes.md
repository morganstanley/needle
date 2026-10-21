# Scoped injection

Hierarchical injection (aka Scoped injection) is the ability to create new child injection scopes which descend from our primary root injector. There are many times when you may require scoped injection, normally they are associated with a given context in our app domains and provide the ability to deviate from the global registrations defined in the root injector.

Scoped injectors inherit their ancestors registrations by default, and then can override those with their own or add additional registrations as required.

Scoped injectors can also be created from other scopes, therefore allowing you to build complex hierarchies which can model your domain accurately.

## Creating a scope

To create a new injection scope we can call the `createScope` method from any `Injector` instance. When we create the new scope we must provide a name for the new scope.

```typescript
const scopedInjector = getRootInjector().createScope('my-scoped-injector');

const amIScoped = scopedInjector.isScoped(); //True
```

## Scope Resolution

By default scoped injectors inherit their parents registrations. Any updates to the parent scopes registrations automatically flow to the child scopes.

Therefore if a parent has defined a registration and we try and resolve that type from our scoped injector, then the type instance will be provided without error.

This is true no matter how deep the scope hierarchy is, as the resolution process walks up the tree until a valid registration is found. Example below.

```typescript
const rootInjector = getRootInjector();

//Single registration
rootInjector.register(Child);

//Create 2 levels of scope
const level2Injector = rootInjector.createScope('level-1').createScope('level-2');

//Instance of child (Serviced from root injector)
const child = level2Injector.get(Child);
```

## Scope overrides

The key reason to create a new scope is in order to provide overrides for a particular context in your applications. During the resolution process for a given type, the injector will first look towards its local registrations and if it finds a match will use that over any parent registrations. Therefore you can easily replace registrations from the hierarchy with your own and create instances localized to your scope and all child scopes within it.

```typescript
const rootInjector = getRootInjector();

//Single registration
rootInjector.register(Child);

//Create 2 levels of scope
const level2Injector = rootInjector.createScope('level-1').createScope('level-2');

//Create our scoped registrations
level2Injector
    .register(Child) //override root registration
    .registerInstance(Teacher, new Teacher('History'));

const child1 = rootInjector.get(Child);
const child2 = level2Injector.get(Child);
const teacher = level2Injector.get(Teacher);

child1 === child2; // False

rootInjector.get(Teacher); //Fails as no registration in parent scopes
```

As a scoped injector is no different to the root injector, the full registration API is available. Therefore you can create registrations of any kind.

## Finding a scope

If you want to resolve a scope you can do this either using the `id` or `name` of the scope. Below is an example.

```typescript
const rootInjector = getRootInjector();

const level2Injector = rootInjector.createScope('level-1');

rootInjector.getScope(level2Injector.id);
rootInjector.getScope('level-1');
```

## Scope disposal

As scoped injectors sit in a tree they can be disposed of easily by calling dispose either on the scope directly or a parent scope.

```typescript
const rootInjector = getRootInjector();

//Single registration
rootInjector.register(Child);

//Create 2 levels of scope
const level2Injector = rootInjector.createScope('level-1').createScope('level-2');

const level1 = rootInjector.getScope('level-1');
const level2 = rootInjector.getScope('level-2');

level1.destroy();

level1.isDestroyed(); //True;
level2.isDestroyed(); //True;
```

## Destroy hooks

When an injection scope is destroyed needle will look to see if injectables in that scopes cache implement `IDestroyable`. If cache references are found, needle will invoke the `needle_destroy` function. This provides a perfect place for you to perform necessary clean up. Example below.

```typescript
export class Child implements IDestroyable {
    public isDestroyed = false;

    public needle_destroy(): void {
        this.isDestroyed = true;
    }
}

const rootInjector = getRootInjector();

//Create a scoped injector
const scopedInjector = rootInjector.createScope('my-new-scope');

scopedInjector.register(Child);

const child = scopedInjector.get(Child);
console.log(child.isDestroyed); //False

scopedInjector.destroy();

console.log(child.isDestroyed); //True
```
