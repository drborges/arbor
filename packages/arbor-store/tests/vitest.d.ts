import "vitest"
import { ArborNode, Link } from "../src"

declare module "vitest" {
  interface Assertion<T> {
    toBeSeeded: () => T
    toBeDetached: () => T
    toBeArborNode: () => T
    toBeScopedNode: () => T
    toBeScoping: <D extends object>(node: ArborNode<D>, prop: keyof D) => T
    toBeProxiedExactlyOnce: () => T
    toBeNodeOf: (expected: unknown) => T
    toHaveNodeFor: (expected: unknown) => T
    toHaveLinkFor: (expected: unknown) => T
    toHaveLink: (link?: Link) => T
  }
}
