import { Visitor } from "../visitor"

export class PathVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$path"
  }

  visit({ target }) {
    return this.ost.pathOf(target)
  }
}
