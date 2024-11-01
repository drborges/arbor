import { expect } from "vitest"

import { Seed } from "../../src"

expect.extend({
  toBeSeeded(received) {
    const isSeeded = Seed.from(received)
    return {
      pass: isSeeded,
      actual: received,
      message: () => `Received value is ${isSeeded ? "" : "not"} seeded`,
    }
  },
})
