import { expect } from "vitest"

import { isNode } from "../../src"

expect.extend({
  toHaveLink(received, expected) {
    if (!isNode(received)) {
      return {
        pass: false,
        actual: received,
        message: () => `Received value is not an Arbor node`,
      }
    }

    const link = received.$tree.getLinkFor(received)

    return {
      pass: link === expected,
      actual: received,
      message: () => `Node link is not ${expected}. Instead it was ${link}`,
    }
  },
})
