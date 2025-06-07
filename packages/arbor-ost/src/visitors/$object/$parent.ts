import { Visitor } from "../visitor"

export class ParentVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$parent"
  }

  visit({ ost, target }) {
    return ost.parentOf(target)
  }
}
