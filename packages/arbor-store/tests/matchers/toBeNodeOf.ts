import { expect } from "vitest"

import { isNode } from "../../src"

expect.extend({
  toBeNodeOf(received, expected) {
    const receivedNode = isNode(received)
    const unwrapped = received.$value
    const isNodeOf = receivedNode && unwrapped === expected
    return {
      pass: isNodeOf,
      message: () =>
        `Received value is ${isNodeOf ? "" : "not"} node of given value`,
    }
  },
})
