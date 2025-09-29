import { Visitor } from "../../visitor"
import { Value } from "../../../types"

export class SetVisitor extends Visitor {
  prop = "set"

  visit({ ost, target, $node }) {
    return (key: unknown, value: Value) => {
      return ost.mutate($node, () => {
        target.set(key, value)

        return {
          args: [key, value],
          operation: "set",
        }
      })
    }
  }
}
