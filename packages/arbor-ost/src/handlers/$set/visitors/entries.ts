import { Visitor } from "../../visitor"
import { isProxiable } from "../../$object/visitors/proxiable"

export class EntriesVisitor extends Visitor {
  prop = "entries"

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
