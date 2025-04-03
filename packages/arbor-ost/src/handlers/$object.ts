import { OST } from "../ost"
import { Node, Value } from "../types"
import { ArborProxiable } from "../decorators/node"
import { ArborDetached } from "../decorators/detached"

function isDetachedProperty(target: unknown, prop: string) {
  return target?.[ArborDetached]?.[prop]
}

function isProxiable(value: unknown): value is object {
  if (value == null) return false

  return (
    value.constructor === Object ||
    value.constructor === Array ||
    value[ArborProxiable]
  )
}

function isGetter(target: object, prop: string) {
  if (!target) {
    return false
  }

  const descriptor = Object.getOwnPropertyDescriptor(target, prop)

  if (descriptor && descriptor.get !== undefined) {
    return true
  }

  return isGetter(Object.getPrototypeOf(target), prop)
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

    const childValue = Reflect.get(target, prop, $node)

    if (isGetter(target, prop) || isDetachedProperty(target, prop)) {
      return childValue
    }

    if (typeof childValue === "function") {
      return childValue.bind($node)
    }

    if (!isProxiable(childValue)) {
      return childValue
    }

    return this.$ost.nodeOf(childValue) || $node.$createChild(childValue)
  }

  set(target: V, prop: string, newValue: unknown, $node: Node<V>): boolean {
    if (isDetachedProperty(target, prop)) {
      return Reflect.set(target, prop, newValue, $node)
    }

    this.$ost.mutate($node, () => {
      const oldValue = target[prop]

      Reflect.set(target, prop, newValue, $node)

      return {
        oldValue,
        newValue,
        operation: "set",
        props: [prop],
      }
    })

    return true
  }

  deleteProperty(target: V, prop: string): boolean {
    if (isDetachedProperty(target, prop)) {
      return Reflect.deleteProperty(target, prop)
    }

    const $node = this.$ost.nodeOf(target)

    this.$ost.mutate($node, (value) => {
      const oldValue = value[prop]

      Reflect.deleteProperty(target, prop)

      return {
        oldValue,
        newValue: undefined,
        operation: "delete",
        props: [prop],
      }
    })

    return true
  }
}
