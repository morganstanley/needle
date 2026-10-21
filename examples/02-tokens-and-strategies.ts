/**
 * Tokens let you inject by name; strategies inject every type registered under a key.
 */
import 'reflect-metadata';
import { getRootInjector, Inject, Injectable, Strategy } from '../main/index.js';

interface IPayment {
    pay(amount: number): string;
}

@Injectable({ tokens: ['payment:card'], strategy: 'payments' })
class CardPayment implements IPayment {
    public pay(amount: number) {
        return `card ${amount}`;
    }
}

@Injectable({ strategy: 'payments' })
class CashPayment implements IPayment {
    public pay(amount: number) {
        return `cash ${amount}`;
    }
}

@Injectable()
class Checkout {
    constructor(
        @Inject('payment:card') public readonly preferred: IPayment,
        @Strategy('payments') public readonly all: IPayment[],
    ) {}
}

const checkout = getRootInjector().get(Checkout);
console.log('Preferred:', checkout.preferred.pay(10));
console.log('All methods:', checkout.all.map((p) => p.pay(5)).join(', '));
console.log(
    'Cash is registered too:',
    checkout.all.some((p) => p instanceof CashPayment),
);
console.log('Preferred is the card:', checkout.preferred instanceof CardPayment);
