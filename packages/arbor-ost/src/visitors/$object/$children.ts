import { Visitor } from "../visitor"

export class ChildrenVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$children"
  }

  visit({ ost, target }) {
    return function* () {
      for (const value of Object.values(target)) {
        const childNode = ost.nodeOf(value)
        if (childNode) yield childNode
      }
    }
  }
}
