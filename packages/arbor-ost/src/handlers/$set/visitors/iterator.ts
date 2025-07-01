import { Visitor } from "../../visitor"
import { isProxiable } from "../../$object/visitors/proxiable"

export class IteratorVisitor extends Visitor {
  prop = Symbol.iterator

  visit({ target, ost, $node }) {
    return function* () {
      for (const value of target.values()) {
        const nodeValue = isProxiable(value)
          ? ost.nodeOf(value) || $node.$createChild(value)
          : value
        yield [nodeValue, nodeValue]
      }
    }
  }
}
