import { Visitor } from "../visitor"

export class ReverseVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "reverse"
  }

  visit({ target, $node }) {
    return () => {
      return this.ost.mutate($node, () => {
        target.reverse()

        return {
          args: [],
          operation: "reverse",
        }
      })
    }
  }
}
