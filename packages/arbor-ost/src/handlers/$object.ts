import { OST } from "../ost"
import { Node, Prop, Value } from "../types"
import { Visitors } from "../visitors"
import { $delete, $set } from "./mutations"

import { isDetachedProperty } from "../visitors/$object/detached"

const objectVisitors = new Visitors()

export class $object<V extends Value = Value> implements ProxyHandler<V> {
  #visitors: Visitors

  constructor(readonly $ost: OST, visitors = objectVisitors) {
    this.#visitors = visitors
  }

  static accepts(_value: unknown) {
    return true
  }

  get(target: V, prop: Prop, $node: Node<V>) {
    // TODO: consider moving back to resolving childValue at this point and passing that down to
    // visitors, this would save some compute cycles since currently each visitor will try to
    // resolve the value of the property potentially on their #accepts and #visit methods.
    //
    // The reason this was changed is because for Maps, accessing some of its properties results
    // in a proxy error where the property is accessed on an invalid receiver, e.g.
    // Reflect.get(target, prop, receiver) where receiver is the actual Proxy node. We could look
    // into using a try catch where upon that error, we fallback to using target as the receiver,
    // this is the scenario where the handler ($map, $set, etc...) is responsible for wrapping the
    // API methods of the underlaying object accordingly.
    return this.#visitors.visit({
      ost: this.$ost,
      target,
      prop,
      $node,
    })
  }

  set(target: V, prop: Prop, newValue: unknown, $node: Node<V>): boolean {
    if (isDetachedProperty(target, prop)) {
      return Reflect.set(target, prop, newValue, $node)
    }

    this.$ost.mutate($node, $set(prop as keyof V, newValue))

    return true
  }

  deleteProperty(target: V, prop: Prop): boolean {
    if (isDetachedProperty(target, prop)) {
      return Reflect.deleteProperty(target, prop)
    }

    const $node = this.$ost.nodeOf(target)
    this.$ost.mutate($node, $delete(prop as keyof V))

    return true
  }
}
