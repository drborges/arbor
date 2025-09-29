import { Visitor } from "../../visitor"
import { Value } from "../../../types"

export class CreateChildVisitor extends Visitor {
  prop = "$createChild"

  visit({ ost, $node }) {
    return (value: Value) => {
      return ost.createNode(value, $node.$path.child())
    }
  }
}
