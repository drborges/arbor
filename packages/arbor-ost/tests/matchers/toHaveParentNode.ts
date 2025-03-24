import { expect } from "vitest"

import { Node } from "../../src/ost/types"

expect.extend({
  toHaveParentNode(node: Node, parent?: Node) {
    const pass =
      node.$parent === parent && node.$path.parentSeed === parent?.$seed

    return {
      pass,
      actual: node,
      expected: parent,
      message: () =>
        `Node ${node.$path.humanized} ${
          pass ? "has" : "does not have"
        } parent node equals to ${
          parent ? parent.$path.humanized : parent
        }. Instead, got ${node.$parent.$path.humanized}`,
    }
  },
})
