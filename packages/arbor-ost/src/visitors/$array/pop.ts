import { Visitor } from "../visitor"

export class PopVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "pop"
  }

  visit({ ost, target, $node }) {
    return () => {
      let popped: unknown

      ost.mutate($node, () => {
        popped = target.pop()

        return {
          args: [],
          operation: "pop",
        }
      })

      return popped
    }
  }
}
