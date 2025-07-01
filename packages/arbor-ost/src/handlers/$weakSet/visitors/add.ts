import { Visitor } from "../../visitor"

export class AddVisitor extends Visitor {
  prop = "add"

  visit({ ost, target, $node }) {
    return (value: object) => {
      // If value already exists, return the proxied node without mutation
      if (target.has(value)) {
        return $node
      }

      return ost.mutate($node, () => {
        target.add(value)

        return {
          args: [value],
          operation: "add",
        }
      })
    }
  }
}
