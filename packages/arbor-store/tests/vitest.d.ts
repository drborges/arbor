import "vitest"

declare module "vitest" {
  interface Assertion<T = any> {
    toBeNodeOf: (expected: unknown) => T
  }
}
