import { expect } from "vitest"

import { isNode, unwrap } from "../../src"

expect.extend({
  toBeProxiedExactlyOnce(received) {
    const isArborNode = isNode(received)

    if (!isArborNode) {
      return {
        pass: false,
        actual: received,
        message: () => `Received value is not an Arbor node`,
      }
    }

    const unwrapped = unwrap(received)
    const proxiedExactlyOnce = !isNode(unwrapped)

    return {
      pass: proxiedExactlyOnce,
      message: () => `Received value was proxied more than once`,
    }
  },
})
