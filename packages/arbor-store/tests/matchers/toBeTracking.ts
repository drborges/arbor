import { expect } from "vitest"

import { ArborError, isNode, NotAnArborNodeError, ScopedStore } from "../../src"
import { Tracked } from "../../src/scoping/scope"

expect.extend({
  toBeTracking(scopedStore, node, prop) {
    if (!(scopedStore instanceof ScopedStore)) {
      throw new ArborError("received value is not an instance of ScopedStore")
    }

    if (!isNode(node)) {
      throw new NotAnArborNodeError()
    }

    const isTrackedNode = (node as Tracked)?.$tracked === true
    const isTrackingNodeProp =
      isTrackedNode && scopedStore.scope.isTracking(node, prop)

    return {
      pass: isTrackingNodeProp,
      actual: scopedStore,
      message: () =>
        `ScopedStore is ${
          isTrackingNodeProp ? "" : "not"
        } tracking prop ${prop} for node ${node}`,
    }
  },
})
