import { Arbor } from "./Arbor"
import { Children } from "./Children"
import { Path } from "./Path"
import { Subscribers } from "./Subscribers"
import { isDetachedProperty } from "./decorators"
import { isNode, isProxiable } from "./guards"
import type { Node } from "./types"
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
    readonly $children = new Children(),
    readonly $subscribers = new Subscribers()
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

  $clone(): Node<T> {
    return this.$tree.createNode(
      this.$path,
      this.$value,
      this.$subscribers,
      this.$children
    )
  }

  $detachChild(childValue: unknown) {
    const [childProp] = Object.entries(this.$value).find(
      ([_, value]) => value === childValue
    )

    delete this[childProp]
  }

  $getChild<V extends object>(value: V): Node<V> {
    if (!this.$children.has(value)) {
      return this.$createChildNode(value)
    }

    return this.$children.get(value)
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

    return this.$getChild(childValue)
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

      this.$children.delete(childValue as object)
    }

    return true
  }

  private $createChildNode<V extends object>(value: V): Node<V> {
    const childPath = this.$path.child(value)
    const childNode = this.$tree.createNode(childPath, value)
    return this.$children.set(childNode)
  }
}
