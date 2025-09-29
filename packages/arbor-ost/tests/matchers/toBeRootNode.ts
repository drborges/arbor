import { expect } from "vitest"

import { Node } from "../../src/types"
import { Path } from "../../src/path"
import { Seed } from "../../src/seed"

expect.extend({
  toBeRootNode(node: Node, expected) {
    const pass =
      node.$parent === undefined &&
      node.$path instanceof Path &&
      node.$path.isRoot() &&
      node.$seed instanceof Seed

    return {
      pass,
      actual: node,
      expected: expected,
      message: () =>
        `Received value is ${pass ? "" : "not "}the OST's root node`,
    }
  },
})
