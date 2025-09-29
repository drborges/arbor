import { Visitor } from "../../visitor"
import { isProxiable } from "../../$object/visitors/proxiable"

export class ForEachVisitor extends Visitor {
  prop = "forEach"

  visit({ target, ost, $node }) {
    return function (
      cb: (value: unknown, value2: unknown, set: unknown) => void,
      thisArg?: unknown
    ) {
      for (const value of target.values()) {
        const nodeValue = isProxiable(value)
          ? ost.nodeOf(value) || $node.$createChild(value)
          : value
        cb.call(thisArg, nodeValue, nodeValue, $node)
      }
    }
  }
}
