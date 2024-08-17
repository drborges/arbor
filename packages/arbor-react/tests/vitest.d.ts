import "vitest"

declare module "vitest" {
  interface Assertion<T> {
    toBeDetached: () => T
    toBeArborNode: () => T
    toBeTrackedNode: () => T
    toBeProxiedExactlyOnce: () => T
    toBeNodeOf: (expected: unknown) => T
    toHaveNodeFor: (expected: unknown) => T
    toHaveLinkFor: (expected: unknown) => T
  }
}
