import { Visitor } from "../visitor"
import { isProxiable } from "../$object/proxiable"

export class GetVisitor extends Visitor {
  prop = "get"

  visit({ target, ost, $node }) {
    return (key: object) => {
      const childValue = target.get(key)

      if (!isProxiable(childValue)) {
        return childValue
      }

      return ost.nodeOf(childValue) || $node.$createChild(childValue)
    }
  }
}
