import { expect } from "vitest"

import { isNode } from "../../src"

expect.extend({
  toBeArborNode(received, expected) {
    const isArborNode = isNode(received)
    return {
      pass: isArborNode,
      actual: received,
      expected: expected,
      message: () =>
        `Received value is ${isArborNode ? "" : "not"} an Arbor node`,
    }
  },
})
