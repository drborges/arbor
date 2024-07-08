import "vitest"

declare module "vitest" {
  interface Assertion<T = any> {
    toBeDetached: () => T
    toBeNodeOf: (expected: unknown) => T
  }
}
