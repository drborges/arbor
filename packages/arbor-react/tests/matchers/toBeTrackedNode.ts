import { expect } from "vitest"

expect.extend({
  toBeTrackedNode(received) {
    const isTracked = (received as any)?.$tracked === true
    return {
      pass: isTracked,
      actual: received,
      message: () =>
        `Received value is ${isTracked ? "" : "not"} a tracked Arbor node`,
    }
  },
})
