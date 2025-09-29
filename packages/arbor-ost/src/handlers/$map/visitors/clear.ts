import { Visitor } from "../../visitor"

export class ClearVisitor extends Visitor {
  prop = "clear"

  visit({ ost, target, $node }) {
    return () => {
      if (target.size === 0) {
        return false
      }

      ost.mutate($node, () => {
        target.clear()

        return {
          args: [],
          operation: "clear",
        }
      })

      return true
    }
  }
}
