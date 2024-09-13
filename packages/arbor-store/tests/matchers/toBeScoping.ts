import { expect } from "vitest"

import { ArborError, isNode, NotAnArborNodeError, ScopedStore } from "../../src"
import { Scoped } from "../../src/scoping/scope"

expect.extend({
  toBeScoping(scopedStore, node, prop) {
    if (!(scopedStore instanceof ScopedStore)) {
      throw new ArborError("received value is not an instance of ScopedStore")
    }

    if (!isNode(node)) {
      throw new NotAnArborNodeError()
    }

    const isScopedNode = (node as Scoped)?.$scoped === true
    const toBeScopingNodeProp =
      isScopedNode && scopedStore.scope.toBeScoping(node, prop)

    return {
      pass: toBeScopingNodeProp,
      actual: scopedStore,
      message: () =>
        `ScopedStore is ${
          toBeScopingNodeProp ? "" : "not"
        } scoping updates to ${prop}`,
    }
  },
})
