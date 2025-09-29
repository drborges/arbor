import "vitest"
import { Node, Value } from "../src/types"
import { OST } from "../src/ost"

declare module "vitest" {
  interface Assertion<T> {
    toBeDetachedFrom: (ost: OST) => T
    toBeNodeOf: (value: Value) => T
    toBeRootNode: () => T
    toHaveNodeFor: (value: Value) => T
    toHaveParentNode: (parent?: Node) => T
    toHaveNodeValuePair: (pair: [unknown, unknown]) => T
  }
}
