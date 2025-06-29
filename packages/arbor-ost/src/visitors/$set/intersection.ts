import { Visitor } from "../visitor"
import { isProxiable } from "../../visitors/$object/proxiable"

export class IntersectionVisitor extends Visitor {
  prop = "intersection"

  visit({ target, ost, $node }) {
    return (other: any) => {
      // Extract underlying Set if other is a proxy
      const otherSet = other?.$value || other
      const result = target.intersection(otherSet)
      const wrappedResult = new Set()

      for (const value of result) {
        if (isProxiable(value)) {
          wrappedResult.add(ost.nodeOf(value) || $node.$createChild(value))
        } else {
          wrappedResult.add(value)
        }
      }

      return wrappedResult
    }
  }
}
