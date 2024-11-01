import { expect } from "vitest"

import { Arbor } from "../../src"

expect.extend({
  toHaveLinkFor(received, expected) {
    const isStore = received instanceof Arbor

    if (!isStore) {
      return {
        pass: !isStore,
        actual: received,
        message: () => `Received value is not an Arbor store`,
      }
    }

    const hasLink = received.getLinkFor(expected) !== undefined

    return {
      pass: hasLink,
      actual: received,
      message: () => `Arbor store does not have a link for the given value`,
    }
  },
})
