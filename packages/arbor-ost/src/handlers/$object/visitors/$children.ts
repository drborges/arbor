import { Visitor } from "../../visitor"

export class ChildrenVisitor extends Visitor {
  prop = "$children"

  visit({ ost, target }) {
    return function* () {
      for (const value of Object.values(target)) {
        const childNode = ost.nodeOf(value)
        if (childNode) yield childNode
      }
    }
  }
}
