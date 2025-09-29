import { Visitor } from "../../visitor"

export class ParentVisitor extends Visitor {
  prop = "$parent"

  visit({ ost, target }) {
    return ost.parentOf(target)
  }
}
