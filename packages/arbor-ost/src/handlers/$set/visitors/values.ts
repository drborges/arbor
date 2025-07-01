import { Visitor } from "../../visitor"
import { isProxiable } from "../../$object/visitors/proxiable"

export class ValuesVisitor extends Visitor {
  prop = "values"

  visit({ target, ost, $node }) {
    return function* () {
      for (const value of target.values()) {
        if (isProxiable(value)) {
          yield ost.nodeOf(value) || $node.$createChild(value)
        } else {
          yield value
        }
      }
    }
  }
}
