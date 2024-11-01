import { expect } from "vitest"

import { Arbor } from "../../src"

expect.extend({
  toHaveNodeFor(received, expected) {
    const isStore = received instanceof Arbor

    if (!isStore) {
      return {
        pass: !isStore,
        actual: received,
        message: () => `Received value is not an Arbor store`,
      }
    }

    const hasNode = received.getNodeFor(expected)

    return {
      pass: hasNode,
      message: () => `Arbor store does not have a node for the given value`,
    }
  },
})
