/**
 * Typed errors tell you what went wrong and the path Needle took to get there.
 * The logger can be swapped to route Needle's diagnostics into your own logging.
 */
import 'reflect-metadata';
import {
    getRootInjector,
    Injectable,
    NeedleError,
    ResolutionError,
    resetLogger,
    setLogger,
    TypeNotRegisteredError,
} from '../main/index.js';

class Wheel {}

@Injectable()
class Bike {
    // Wheel is not decorated or registered, so resolution fails
    constructor(public readonly wheel: Wheel) {}
}

try {
    getRootInjector().get(Bike);
} catch (e) {
    if (e instanceof TypeNotRegisteredError) {
        console.log('code:', e.code);
        console.log('resolution path:', e.resolutionPath.join(' -> '));
    }
    console.log('is a ResolutionError:', e instanceof ResolutionError, '| is a NeedleError:', e instanceof NeedleError);
}

// Route Needle's diagnostics through your own logger. Here a cache predicate that throws is reported as a warning.
@Injectable({
    cacheStrategy: {
        type: 'conditional',
        predicate: () => {
            throw new Error('predicate blew up');
        },
    },
})
class Flaky {}

const captured: string[] = [];
setLogger({ warn: (message) => captured.push(message), log: () => undefined });
getRootInjector().get(Flaky);
getRootInjector().cache.purge();
await Promise.resolve(); // let the scheduled verification finish while our logger is installed
resetLogger();
console.log('custom logger captured:', captured);
