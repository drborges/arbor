import { Visitor } from "../visitor"

export class ToStringTagVisitor extends Visitor {
  accepts({ prop }) {
    return prop === Symbol.toStringTag
  }

  visit({ ost, target, $node }) {
    const detachedIndicator = ost.isDetached(target) ? "*" : ""
    return `ArborNode<${target.constructor.name}(${detachedIndicator}${$node.$seed.value})>`
  }
}
