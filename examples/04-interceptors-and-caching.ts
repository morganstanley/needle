/**
 * Interceptors observe construction; cache strategies control how long instances live.
 */
import 'reflect-metadata';
import { getRootInjector, IConstructionInterceptor, IInjectionContext, Injectable } from '../main/index.js';

@Injectable({ cacheStrategy: 'no-cache' })
class Ticket {
    public readonly serial = Math.random().toString(36).slice(2, 6);
}

// Register with `@Interceptor()` to have an instance created and registered for you, or do it by hand as here.
class TicketInterceptor implements IConstructionInterceptor<typeof Ticket> {
    public readonly target = Ticket;
    public created = 0;
    public beforeCreate(context: IInjectionContext<typeof Ticket>): void {
        console.log('about to create', context.type.name);
    }
    public afterCreate(instance: Ticket): void {
        this.created++;
        console.log('created ticket', instance.serial);
    }
}

const interceptor = new TicketInterceptor();
getRootInjector().registerInterceptor(interceptor);

const a = getRootInjector().get(Ticket);
const b = getRootInjector().get(Ticket);
console.log('no-cache gives a new instance each time:', a !== b);
console.log('interceptor saw', interceptor.created, 'constructions');
