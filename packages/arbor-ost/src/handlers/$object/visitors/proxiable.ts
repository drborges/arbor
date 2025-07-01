import { Visitor } from "../../visitor"
import { ArborProxiable } from "../../../decorators/node"

export function isProxiable(value: unknown): value is object {
  if (value == null) return false

  return (
    value.constructor === Object ||
    value.constructor === Array ||
    value.constructor === Map ||
    value.constructor === Set ||
    value.constructor === WeakMap ||
    value.constructor === WeakSet ||
    value[ArborProxiable]
  )
}

export class ProxiableVisitor extends Visitor {
  accepts({ childValue }) {
    return isProxiable(childValue)
  }

  visit({ ost, $node, childValue }) {
    return ost.nodeOf(childValue) || $node.$createChild(childValue)
  }
}
