import { Visitor } from "../visitor"
import { Value } from "../../types"
import { $push } from "../../handlers/mutations"

export class PushVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "push"
  }

  visit({ $node }) {
    return (...items: Value[]) => {
      const arr = this.ost.mutate($node, $push(items))
      return arr.length
    }
  }
}
