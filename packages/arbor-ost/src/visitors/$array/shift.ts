import { $shift } from "../../handlers/mutations"
import { Visitor } from "../visitor"

export class ShiftVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "shift"
  }

  visit({ target, $node }) {
    return () => {
      const removed = target[0]
      this.ost.mutate($node, $shift())
      return removed
    }
  }
}
