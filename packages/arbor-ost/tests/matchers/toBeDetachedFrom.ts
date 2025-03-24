import { expect } from "vitest"

import { Node } from "../../src/ost/types"
import { OST } from "../../src/ost"

expect.extend({
  toBeDetachedFrom(node: Node, ost: OST) {
    const pass = ost.isDetached(node.$value)

    return {
      pass,
      actual: node,
      message: () =>
        `Node ${ost.humanizePath(node.$path)} ${
          pass ? "is" : "is not"
        } detached from the given OST.`,
    }
  },
})
