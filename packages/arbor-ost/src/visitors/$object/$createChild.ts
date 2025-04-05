import { Visitor } from "../visitor"
import { Value } from "../../types"

export class CreateChildVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$createChild"
  }

  visit({ $node }) {
    return (value: Value) => {
      return this.ost.createNode(value, $node.$path.child())
    }
  }
}
