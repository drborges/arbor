import { OST } from "../ost"
import { DetachedPathError } from "../errors"
import { Node, Value } from "../types"

export function isProxiable(value: unknown): value is object {
  if (value == null) return false

  return value.constructor === Object || value.constructor === Array
}

export class $object<V extends Value = Value> implements ProxyHandler<V> {
  constructor(readonly $ost: OST) {}

  static accepts(_value: unknown) {
    return true
  }

  get(target: V, prop: string, $node: Node<V>) {
    if (prop === "$value") {
      return target
    }

    if (prop === "$path") {
      return this.$ost.pathOf(target)
    }

    if (prop === "$seed") {
      return this.$ost.seedOf(target)
    }

    if (prop === "$parent") {
      return this.$ost.parentOf(target)
    }

    if (prop === "$subscriptions") {
      return this.$ost.subscriptionsOf(target)
    }

    if (prop === "$children") {
      return function* () {
        for (const value of Object.values(target)) {
          const childNode = this.$ost.nodeOf(value)
          if (childNode) yield childNode
        }
      }.bind(this)
    }

    if (prop === "$createChild") {
      return (value: Value) => {
        return this.$ost.createNode(value, $node.$path.child())
      }
    }

    const childValue = Reflect.get(target, prop, $node) as unknown

    if (!isProxiable(childValue)) {
      return childValue
    }

    return this.$ost.nodeOf(childValue) || $node.$createChild(childValue)
  }

  set(target: V, prop: string, newValue: unknown, $node: Node<V>): boolean {
    if (this.$ost.isDetached(target)) {
      throw new DetachedPathError(this.$ost.humanizePath($node.$path))
    }

    Reflect.set(target, prop, newValue, $node)
    return true
  }

  deleteProperty(target: V, prop: string): boolean {
    if (this.$ost.isDetached(target)) {
      const path = this.$ost.pathOf(target)
      throw new DetachedPathError(this.$ost.humanizePath(path))
    }

    Reflect.deleteProperty(target, prop)
    return true
  }
}
