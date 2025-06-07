import { Visitor } from "../visitor"

export class PathVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$path"
  }

  visit({ ost, target }) {
    return ost.pathOf(target)
  }
}
