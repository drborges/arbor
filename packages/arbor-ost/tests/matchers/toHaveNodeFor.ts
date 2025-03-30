import { expect } from "vitest"

import { Value } from "../../src/ost/types"
import { OST } from "../../src/ost"

expect.extend({
  toHaveNodeFor(ost: OST, value: Value) {
    const pass = ost.seedOf(value) != null

    return {
      pass,
      actual: ost,
      message: () =>
        `Ost ${pass ? "has" : "does not have"} a node for the given value.`,
    }
  },
})
