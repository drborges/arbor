import { Visitor } from "../../visitor"

export class PathVisitor extends Visitor {
  prop = "$path"

  visit({ ost, target }) {
    return ost.pathOf(target)
  }
}
