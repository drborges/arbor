import { $unshift } from "../../handlers/mutations"
import { Visitor } from "../visitor"

export class UnshiftVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "unshift"
  }

  visit({ $node }) {
    return (...args: unknown[]) => {
      const arr = this.ost.mutate($node, $unshift(...args))
      return arr.length
    }
  }
}
