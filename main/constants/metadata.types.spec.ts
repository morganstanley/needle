import { describe, expect, it } from 'vitest';
import { METADATA } from './constants.js';
import type { IInjectionConfiguration } from '../contracts/contracts.js';

// Type-level regression: METADATA placeholders must be assignable to any constructor parameter slot (TS2322 in 1.0.0).
interface InterceptorStrategies {
    retry: number;
}
interface HttpFactory {
    create(): string;
}
class Logger {}

class Http {
    constructor(
        public logger: Logger,
        public strategies: InterceptorStrategies,
        public factory: HttpFactory,
        public token: { url: string },
    ) {}
}

describe('METADATA placeholder types', () => {
    it('are assignable to non-any constructor parameter types', () => {
        const config: IInjectionConfiguration<typeof Http> = {
            metadata: [Logger, METADATA.strategy, METADATA.factory, METADATA.token],
        };
        expect(config.metadata).toHaveLength(4);
    });
});
