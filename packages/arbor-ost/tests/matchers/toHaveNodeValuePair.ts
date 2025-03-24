import { expect } from "vitest"

import { Node, Value } from "../../src/ost/types"
import { OST } from "../../src/ost"

expect.extend({
  toHaveNodeValuePair(ost: OST, [node, value]: [Node, Value]) {
    const pass = ost.nodeOf(value) === node && node.$value === value

    return {
      pass,
      actual: ost,
      message: () =>
        `Ost ${pass ? "has" : "does not have"} the given node-value pair.`,
    }
  },
})
