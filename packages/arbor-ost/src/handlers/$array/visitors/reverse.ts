import { Visitor } from "../../visitor"

export class ReverseVisitor extends Visitor {
  prop = "reverse"

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
