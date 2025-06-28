import { Visitor } from "../visitor"
import { isProxiable } from "../../visitors"

export class ProxiableVisitor extends Visitor {
  accepts({ target, prop, $node }) {
    const childValue = Reflect.get(target, prop, $node)
    return isProxiable(childValue)
  }

  visit({ ost, target, prop, $node }) {
    const childValue = Reflect.get(target, prop, $node)
    return ost.nodeOf(childValue) || $node.$createChild(childValue)
  }
}
