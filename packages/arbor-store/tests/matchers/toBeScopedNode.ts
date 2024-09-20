import { expect } from "vitest"

import { Scoped } from "../../src/scoping/scope"

expect.extend({
  toBeScopedNode(received) {
    const isScoped = (received as Scoped)?.$scoped === true
    return {
      pass: isScoped,
      actual: received,
      message: () =>
        `Received value is ${isScoped ? "" : "not"} a scoped Arbor node`,
    }
  },
})
