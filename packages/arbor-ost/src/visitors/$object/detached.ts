import { Prop } from "../../types"
import { Visitor } from "../visitor"
import { ArborDetached } from "../../decorators/detached"

export function isDetachedProperty(target: unknown, prop: Prop) {
  return target?.[ArborDetached]?.[prop]
}

export class DetachedVisitor extends Visitor {
  accepts({ target, prop }) {
    return isDetachedProperty(target, prop)
  }

  visit({ target, prop }) {
    return Reflect.get(target, prop)
  }
}
