import { Visitor } from "../visitor"
import { isProxiable } from "../../visitors/$object/proxiable"

export class KeysVisitor extends Visitor {
  prop = "keys"

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
