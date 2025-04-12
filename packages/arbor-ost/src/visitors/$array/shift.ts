import { Visitor } from "../visitor"

export class ShiftVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "shift"
  }

  visit({ target, $node }) {
    return () => {
      let removed: unknown

      this.ost.mutate($node, () => {
        removed = target.shift()

        return {
          args: [],
          operation: "shift",
        }
      })

      return removed
    }
  }
}
