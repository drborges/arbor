import { $reverse } from "../../handlers/mutations"
import { Visitor } from "../visitor"

export class ReverseVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "reverse"
  }

  visit({ $node }) {
    return () => {
      return this.ost.mutate($node, $reverse())
    }
  }
}
