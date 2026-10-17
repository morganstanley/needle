# Integrating with Angular 2+

If you want to integrate this library with Angular's dependency injection system it's a pretty easy thing to do. In the `main.ts` file of your Angular app you can resolve all the registered providers and then pass them to the `platformBrowserDynamic` call.

```typescript
import 'reflect-metadata';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { getRegisteredTypesWithFactories } from '@morgan-stanley/needle';
import { AppModule } from 'app/app.module';

const providers = getRegisteredTypesWithFactories();

platformBrowserDynamic(providers)
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
```

## Using Needle's decorators within Angular components

It is important to note that the decorators provided by Needle cannot be used directly within the constructor of an Angular component. Angular is not aware of these decorators so it is unable to resolve the required instances at runtime. When working with Angular components the `Injector` API should be used instead. To access the `Injector` API inject an instance of the `Injector` directly into your component.

```typescript
import { Injector } from '@morgan-stanley/needle';

@Component({
    selector: 'my-component',
    templateUrl: './my-component.html',
    styleUrls: ['./my-component.scss'],
})
export class MyComponent {
    constructor(injector: Injector) {
        // Example resolutions
        const strategies = injector.getStrategies('work-strategies');
        const carLazy = injector.getLazy(Car);
    }
}
```
