import { OST } from "../../ost"
import { Node, Prop, Value } from "../../types"
import { Visitors } from "../visitors"

import { isDetachedProperty } from "./visitors/detached"

const defaultVisitors = new Visitors()

export class $object<V extends Value = Value> implements ProxyHandler<V> {
  #visitors: Visitors

  constructor(readonly $ost: OST, visitors = defaultVisitors) {
    this.#visitors = visitors
  }

  static accepts(_value: unknown) {
    return true
  }

  get(target: V, prop: Prop, $node: Node<V>) {
    const childValue = Reflect.get(target, prop, target) as Value

    return this.#visitors.visit({
      ost: this.$ost,
      target,
      prop,
      $node,
      childValue,
    })
  }

  set(target: V, prop: Prop, newValue: unknown, $node: Node<V>): boolean {
    if (isDetachedProperty(target, prop)) {
      return Reflect.set(target, prop, newValue, $node)
    }

    this.$ost.mutate($node, () => {
      Reflect.set(target, prop, newValue, $node)

      return {
        args: [prop, newValue],
        operation: "set",
      }
    })

    return true
  }

  deleteProperty(target: V, prop: Prop): boolean {
    if (isDetachedProperty(target, prop)) {
      return Reflect.deleteProperty(target, prop)
    }

    const $node = this.$ost.nodeOf(target)

    this.$ost.mutate($node, () => {
      Reflect.deleteProperty(target, prop)

      return {
        args: [prop],
        operation: "delete",
      }
    })

    return true
  }
}
