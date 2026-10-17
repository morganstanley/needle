/**
 * Scopes: child injectors that can override registrations and be disposed.
 */
import 'reflect-metadata';
import { getRootInjector, Injectable, Injector } from '../main/index.js';

@Injectable()
class Session {
    public readonly id = Math.random().toString(36).slice(2, 8);
}

const root = getRootInjector();
const requestScope = root.createScope('request-1');

// A scope falls back to its parent for anything it has no registration for
console.log('Scope resolves from root:', requestScope.get(Session) === root.get(Session));

// ...but can override it locally
class TestSession extends Session {}
requestScope.register(TestSession).register(Session, { resolution: TestSession });
console.log('Scope override:', requestScope.get(Session) instanceof TestSession);
console.log('Root unaffected:', !(root.get(Session) instanceof TestSession));

console.log('Found scope by name:', root.getScope('request-1') === requestScope);

requestScope.destroy();
console.log('Destroyed:', requestScope.isDestroyed());
console.log('Root is an Injector:', root instanceof Injector);
