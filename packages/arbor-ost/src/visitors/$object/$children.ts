import { Visitor } from "../visitor"

export class ChildrenVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$children"
  }

  visit({ target }) {
    return function* () {
      for (const value of Object.values(target)) {
        const childNode = this.ost.nodeOf(value)
        if (childNode) yield childNode
      }
    }.bind(this)
  }
}
