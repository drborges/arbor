import { Visitor } from "../visitor"
import { isProxiable } from "../../visitors"

export class GetVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "get"
  }

  visit({ target, ost, $node }) {
    return (key: unknown) => {
      const childValue = target.get(key)

      if (!isProxiable(childValue)) {
        return childValue
      }

      return ost.nodeOf(childValue) || $node.$createChild(childValue)
    }
  }
}
