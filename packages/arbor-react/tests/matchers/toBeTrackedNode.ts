import { expect } from "vitest"

expect.extend({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toBeTrackedNode(received: any) {
    const isTracked = received.$tracked === true
    return {
      pass: isTracked,
      actual: received,
      message: () =>
        `Received value is ${isTracked ? "" : "not"} a tracked Arbor node`,
    }
  },
})
