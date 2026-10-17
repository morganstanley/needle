/**
 * Basics: make types injectable and resolve them.
 * Run with: npm run examples
 */
import 'reflect-metadata';
import { getRootInjector, Injectable } from '../main/index.js';

@Injectable()
class Engine {
    public readonly horsepower = 150;
}

@Injectable()
class Car {
    // Needle reads `Engine` from the constructor signature (emitDecoratorMetadata)
    constructor(public readonly engine: Engine) {}
}

const car = getRootInjector().get(Car);
console.log(`Car has an engine with ${car.engine.horsepower}hp`);

// Instances are cached by default, so the same engine is shared
console.log('Same engine instance:', getRootInjector().get(Engine) === car.engine);
