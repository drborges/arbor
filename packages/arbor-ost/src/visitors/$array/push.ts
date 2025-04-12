import { Visitor } from "../visitor"
import { Value } from "../../types"

export class PushVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "push"
  }

  visit({ target, $node }) {
    return (...items: Value[]) => {
      let length: number

      this.ost.mutate($node, () => {
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
