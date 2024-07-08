import "vitest"

declare module "vitest" {
  interface Assertion<T = any> {
    toBeDetached: () => T
    toBeArborNode: () => T
    toBeNodeOf: (expected: unknown) => T
    toHaveNodeFor: (expected: unknown) => T
  }
}
