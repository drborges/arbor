import { Visitor } from "../visitor"
import { ArborProxiable } from "../../decorators/node"

function isProxiable(value: unknown): value is object {
  if (value == null) return false

  return (
    value.constructor === Object ||
    value.constructor === Array ||
    value[ArborProxiable]
  )
}

export class ProxiableVisitor extends Visitor {
  accepts({ childValue }) {
    return isProxiable(childValue)
  }

  visit({ childValue, $node }) {
    return this.ost.nodeOf(childValue) || $node.$createChild(childValue)
  }
}
