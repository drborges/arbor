import { Visitor } from "../visitor"

export class AddVisitor extends Visitor {
  prop = "add"

  visit({ ost, target, $node }) {
    return (value: unknown) => {
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
