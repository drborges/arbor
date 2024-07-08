import { expect } from "vitest"

import { isDetached } from "../../src"

expect.extend({
  toBeDetached(received) {
    const isDetachedNode = isDetached(received)
    return {
      pass: isDetachedNode,
      message: () =>
        `Received value is ${isDetachedNode ? "" : "not"} a detached node`,
    }
  },
})
