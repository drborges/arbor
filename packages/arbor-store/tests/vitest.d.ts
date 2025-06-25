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
    toBeNodeOf: (expected: object) => T
    toHaveNodeFor: (expected: object) => T
    toHaveLinkFor: (expected: unknown) => T
    toHaveLink: (link?: Link) => T
  }
}
