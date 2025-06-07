import { Visitor } from "../visitor"

export class ReverseVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "reverse"
  }

  visit({ ost, target, $node }) {
    return () => {
      return ost.mutate($node, () => {
        target.reverse()

        return {
          args: [],
          operation: "reverse",
        }
      })
    }
  }
}
