import { Visitor } from "../visitor"
import { $pop } from "../../handlers/mutations"

export class PopVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "pop"
  }

  visit({ target, $node }) {
    return () => {
      const popped = target.at(-1)
      this.ost.mutate($node, $pop())
      return popped
    }
  }
}
