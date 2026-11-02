import { Token } from '../contracts/contracts.js';

/**
 * Creates a typed injection token. At runtime it is a unique `symbol`; the type parameter records what it resolves to,
 * so `get(token)`, `getOptional(token)`, `getLazy(token)` and `injectable(Type, [token])` infer and check types.
 *
 * Tokens are unique per call, even with the same description, and survive `@Inject(token)`, `dep.token(token)`,
 * `@Injectable({ tokens: [token] })` and `registerValue` unchanged.
 *
 * @example
 * const Config = createToken<AppConfig>('config');
 * getRootInjector().registerValue({ tokens: [Config], value: { url: '/' } });
 * const config = get(Config); // AppConfig
 *
 * @param description shown in `toString()` and error messages
 */
export function createToken<T>(description?: string): Token<T> {
    return Symbol(description) as Token<T>;
}
