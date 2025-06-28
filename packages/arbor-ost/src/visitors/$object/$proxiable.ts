import { Visitor } from "../visitor"
import { isProxiable } from "../../visitors"

export class ProxiableVisitor extends Visitor {
  accepts({ childValue }) {
    return isProxiable(childValue)
  }

  visit({ ost, $node, childValue }) {
    return ost.nodeOf(childValue) || $node.$createChild(childValue)
  }
}
