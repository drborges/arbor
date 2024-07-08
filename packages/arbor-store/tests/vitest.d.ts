import "vitest"

declare module "vitest" {
  interface Assertion<T = any> {
    toBeDetached: () => T
    toBeArborNode: () => T
    toBeProxiedExactlyOnce: () => T
    toBeNodeOf: (expected: unknown) => T
    toHaveNodeFor: (expected: unknown) => T
    toHaveLinkFor: (expected: unknown) => T
  }
}
