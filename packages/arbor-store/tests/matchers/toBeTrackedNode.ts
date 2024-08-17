import { expect } from "vitest"

import { Tracked } from "../../src/scoping/scope"

expect.extend({
  toBeTrackedNode(received) {
    const isTracked = (received as Tracked)?.$tracked === true
    return {
      pass: isTracked,
      actual: received,
      message: () =>
        `Received value is ${isTracked ? "" : "not"} a tracked Arbor node`,
    }
  },
})
