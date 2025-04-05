import { Visitor } from "../visitor"
import { Prop } from "../../types"

function isGetter(target: object, prop: Prop) {
  if (!target) {
    return false
  }

  const descriptor = Object.getOwnPropertyDescriptor(target, prop)

  if (descriptor && descriptor.get !== undefined) {
    return true
  }

  return isGetter(Object.getPrototypeOf(target), prop)
}

export class GetterVisitor extends Visitor {
  accepts({ target, prop }) {
    return isGetter(target, prop)
  }

  visit({ childValue }) {
    return childValue
  }
}
