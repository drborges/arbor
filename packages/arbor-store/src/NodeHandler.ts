import { Arbor } from "./Arbor"
import { Path } from "./Path"
import { Seed } from "./Seed"
import { Subscribers } from "./Subscribers"
import { isDetachedProperty } from "./decorators"
import { isNode, isProxiable } from "./guards"
import type { Link, Node } from "./types"
import { isGetter } from "./utilities"

const PROXY_HANDLER_API = ["apply", "get", "set", "deleteProperty"]

/**
 * Default node handler implementation.
 */
export class NodeHandler<T extends object = object> implements ProxyHandler<T> {
  /**
   * Caches all method / function props in the proxied object while
   * binding them to the proxy instance itself so that all logic
   * implemented in these methods can run within the context of the
   * proxy.
   */
  protected $bindings = new WeakMap()

  constructor(
    readonly $tree: Arbor,
    readonly $path: Path,
    readonly $value: T,
    readonly $subscribers = new Subscribers<T>()
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

  get $seed() {
    return Seed.from(this.$value)
  }

  get $link() {
    return this.$tree.links.get(this.$seed)
  }

  get $lastRevision() {
    return this.$tree.getNodeAt(this.$path)
  }

  $is(node: Node) {
    if (!node) {
      return false
    }

    return this.$seed === node.$seed
  }

  $traverse<C extends object>(link: Link): Node<C> {
    return this.$value[link]
  }

  $attach<C extends object>(link: Link, value: C) {
    this.$value[link] = value
  }

  get(target: T, prop: string, proxy: Node<T>) {
    // Access $unwrap, $clone, $children, etc...
    const handlerApiAccess = Reflect.get(this, prop, proxy)

    if (isGetter(target, prop) || isDetachedProperty(target, prop)) {
      return Reflect.get(target, prop, proxy)
    }

    // Allow proxied values to defined properties named 'get', 'set', 'deleteProperty'
    // without conflicting with the ProxyHandler API.
    if (handlerApiAccess && !PROXY_HANDLER_API.includes(prop)) {
      return handlerApiAccess
    }

    let childValue = Reflect.get(target, prop, proxy) as unknown

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
      if (!this.$bindings.has(childValue)) {
        this.$bindings.set(childValue, childValue.bind(proxy))
      }

      return this.$bindings.get(childValue)
    }

    if (!isProxiable(childValue)) {
      return childValue
    }

    if (!this.$tree.getNodeFor(childValue)) {
      this.$createChildNode(prop, childValue)
    }

    return this.$tree.getNodeFor(childValue)
  }

  set(target: T, prop: string, newValue: unknown, proxy: Node<T>): boolean {
    // Automatically unwraps values when they are already Arbor nodes,
    // this prevents proxying proxies and thus forcing stale node references
    // to be kept in memmory unnecessarily.
    const value = isNode(newValue) ? newValue.$value : newValue

    // Ignores the mutation if new value is already the current value
    if (target[prop] === value) return true

    if (isDetachedProperty(target, prop)) {
      target[prop] = value
      return true
    }

    if (isNode(newValue)) {
      // Detaches the previous node from the state tree since it's being overwritten by a new one
      this.$tree.deleteNodeFor(target[prop])

      // In case the new value happens to be an existing node, we preemptively add it back to the
      // state tree so that stale references to this node can continue to trigger mutations.
      this.$createChildNode(prop, newValue.$value)
    }

    // TODO: Throw ValueAlreadyBoundError if value is already bound to a child path
    this.$tree.mutate(proxy, (t: T) => {
      t[prop] = value

      return {
        operation: "set",
        props: [prop],
      }
    })

    return true
  }

  deleteProperty(target: T, prop: string): boolean {
    if (prop in target) {
      const childValue = Reflect.get(target, prop)

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

      this.$tree.deleteNodeFor(childValue as object)
    }

    return true
  }

  protected $getOrCreateChild<V extends object>(link: Link, value: V): Node<V> {
    if (!this.$tree.getNodeFor(value)) {
      const path = this.$path.child(Seed.plant(value))
      return this.$tree.createNode(path, value, link)
    }

    return this.$tree.getNodeFor(value)
  }

  protected $createChildNode<V extends object>(link: Link, value: V): Node<V> {
    const seed = Seed.plant(value)
    const childPath = this.$path.child(seed)
    return this.$tree.createNode<V>(childPath, value, link)
  }
}
