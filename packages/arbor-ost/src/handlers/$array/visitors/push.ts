import { Visitor } from "../../visitor"
import { Value } from "../../../types"

export class PushVisitor extends Visitor {
  prop = "push"

  visit({ ost, target, $node }) {
    return (...items: Value[]) => {
      let length: number

      ost.mutate($node, () => {
        length = target.push(...items)

        return {
          args: [items],
          operation: "push",
        }
      })

      return length
    }
  }
}
