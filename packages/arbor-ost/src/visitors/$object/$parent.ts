import { Visitor } from "../visitor"

export class ParentVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$parent"
  }

  visit({ target }) {
    return this.ost.parentOf(target)
  }
}
