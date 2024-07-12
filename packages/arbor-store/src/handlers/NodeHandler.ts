import { Arbor } from "../Arbor"
import { isDetachedProperty } from "../decorators"
import { isNode, isProxiable } from "../guards"
import { Seed } from "../path"
import { Subscriptions } from "../Subscriptions"
import type { Link, Node } from "../types"
import { isGetter, pathFor, recursivelyUnwrap } from "../utilities"

const PROXY_HANDLER_API = ["apply", "get", "set", "deleteProperty"]

/**
 * Default node handler implementation.
 *
 * Implements the proxying mechanism used by Arbor to intercept access to fields of
 * objects witihin the state tree as well as mutations to them, enabling subscribers
 * to be notified of events they are interested in.
 */
export class NodeHandler<T extends object = object> implements ProxyHandler<T> {
  constructor(
    readonly $tree: Arbor,
    readonly $value: T,
    readonly $subscriptions = new Subscriptions<T>()
  ) {}

  /**
   * Checks if this node handler implementation can handle a given value belonging to
   * the state tree.
   *
   * Since this implementation is the default node handler, it will always return true
   * no matter the value passed in.
   *
   * @param _value node value to check. Ignored by this implementation.
   * @returns always true.
   */
  static accepts(_value: unknown) {
    return true
  }

  $getChildNode<C extends object>(link: Link): Node<C> {
    return this[link]
  }

  $setChildValue<C extends object>(value: C, link: Link) {
    this.$value[link] = value
  }

  get(target: T, prop: string, proxy: Node<T>) {
    // Access $unwrap, $clone, $children, etc...
    const handlerApiAccess = Reflect.get(this, prop, proxy)
    // Allow proxied values to defined properties named 'get', 'set', 'deleteProperty'
    // without conflicting with the ProxyHandler API.
    if (handlerApiAccess && !PROXY_HANDLER_API.includes(prop)) {
      return handlerApiAccess
    }

    let childValue = Reflect.get(target, prop, proxy) as unknown

    if (isGetter(target, prop) || isDetachedProperty(target, prop)) {
      return childValue
    }

    // Automatically unwrap proxied values that may have been used to initialize the store
    // either via new Arbor(...) or store.setState(...).
    // This is done for consistency at the moment to ensure that node values are not proxies
    // but the actual proxied value. This decision can be revisited if needed.
    if (isNode(childValue)) {
      childValue = childValue.$value
    }

    // Method and function props are all bound to the proxy and cached internally
    // so that accessing these props on the same proxy instance always returns the
    // same value, keeping memory reference integrity (real useful in libs such as
    // React).
    if (typeof childValue === "function") {
      return childValue.bind(proxy)
    }

    if (!isProxiable(childValue)) {
      return childValue
    }

    return this.$tree.traverse(proxy, prop, childValue)
  }

  set(target: T, prop: string, newValue: unknown, proxy: Node<T>): boolean {
    // Automatically unwraps values when they are already Arbor nodes,
    // this prevents proxying proxies and thus forcing stale node references
    // to be kept in memmory unnecessarily.
    const value = recursivelyUnwrap(newValue)

    // Ignores the mutation if new value is already the current value
    if (target[prop] === value) return true

    // Detached properties do not trigger mutation events
    // they are mutated in place.
    if (isDetachedProperty(target, prop)) {
      target[prop] = value
      return true
    }

    if (isNode(newValue)) {
      // Detaches the previous node from the state tree since it's being overwritten by a new one
      if (target[prop]) {
        this.$tree.detachNodeFor(target[prop])
      }

      // In case the new value happens to be an existing node, we preemptively add it back to the
      // state tree so that stale references to this node can continue to trigger mutations.
      const path = pathFor(this).child(Seed.plant(value))
      this.$tree.createNode(path, value, prop)
    }

    const previouslyUndefined = target[prop] === undefined

    this.$tree.mutate(proxy, (t: T) => {
      t[prop] = value

      return {
        operation: "set",
        props: [prop],
        previouslyUndefined,
      }
    })

    return true
  }

  deleteProperty(target: T, prop: string): boolean {
    if (prop in target) {
      const childValue = Reflect.get(target, prop)

      // Detached properties do not trigger mutation events
      // they are mutated in place.
      if (isDetachedProperty(target, prop)) {
        delete target[prop]
        return true
      }

      this.$tree.mutate(this, (t: T) => {
        delete t[prop]

        return {
          operation: "delete",
          props: [prop],
        }
      })

      this.$tree.detachNodeFor(childValue as object)
    }

    return true
  }
}
