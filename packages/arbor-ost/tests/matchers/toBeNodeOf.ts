import { expect } from "vitest"

import { Node, Value } from "../../src/types"

expect.extend({
  toBeNodeOf(node: Node, value: Value) {
    const expected = node.$ost.nodeOf(value)
    const pass =
      expected === node

    return {
      pass,
      actual: node,
      expected,
      message: () =>
        `Node ${node.$path.humanize()} ${
          pass ? "is" : "is not"
        } the node of ${value}`,
    }
  },
})
