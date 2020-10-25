import 'reflect-metadata';

declare const require: any;

// Find all the tests.
const context = (require as any).context('./', true, /.spec.ts$/);
// And load the modules.
context.keys().map(context);
