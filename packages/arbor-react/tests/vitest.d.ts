import "vitest"

declare module "vitest" {
  interface Assertion<T> {
    toBeDetached: () => T
    toBeArborNode: () => T
    toBeScopedNode: () => T
    toBeProxiedExactlyOnce: () => T
    toBeNodeOf: (expected: object) => T
    toHaveNodeFor: (expected: object) => T
    toHaveLinkFor: (expected: unknown) => T
  }
}
