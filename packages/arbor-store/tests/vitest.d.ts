import "vitest"
import { ArborNode } from "../src"

declare module "vitest" {
  interface Assertion<T> {
    toBeDetached: () => T
    toBeArborNode: () => T
    toBeTrackedNode: () => T
    toBeTracking: <D extends object>(node: ArborNode<D>, prop: keyof D) => T
    toBeProxiedExactlyOnce: () => T
    toBeNodeOf: (expected: unknown) => T
    toHaveNodeFor: (expected: unknown) => T
    toHaveLinkFor: (expected: unknown) => T
  }
}
