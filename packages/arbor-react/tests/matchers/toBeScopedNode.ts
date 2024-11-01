import { expect } from "vitest"

expect.extend({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toBeScopedNode(received: any) {
    const isScoped = received.$scoped === true
    return {
      pass: isScoped,
      actual: received,
      message: () =>
        `Received value is ${isScoped ? "" : "not"} a tracked Arbor node`,
    }
  },
})
