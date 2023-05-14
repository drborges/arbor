import Arbor, { INode } from "./Arbor"
import NodeCache from "./NodeCache"
import Path from "./Path"
import Subscribers from "./Subscribers"
import isNode from "./isNode"
import isProxiable from "./isProxiable"

const PROXY_HANDLER_API = ["apply", "get", "set", "deleteProperty"]

export default class NodeHandler<
  T extends object = object,
  K extends object = object
> implements ProxyHandler<T>
{
  /**
   * Caches all method / function props in the proxied object while
   * binding them to the proxy instance itself so that all logic
   * implemented in these methods can run within the context of the
   * proxy.
   */
  protected $bindings = new WeakMap()

  constructor(
    readonly $tree: Arbor<K>,
    readonly $path: Path,
    readonly $value: T,
    readonly $children = new NodeCache(),
    readonly $subscribers = new Subscribers()
  ) {}

  static accepts(_value: unknown) {
    return true
  }

  $unwrap(): T {
    return this.$value
  }

  $clone(): INode<T> {
    return this.$tree.createNode(
      this.$path,
      this.$value,
      this.$subscribers,
      this.$children
    )
  }

  get(target: T, prop: string, proxy: INode<T>) {
    // Access $unwrap, $clone, $children, etc...
    const handlerApiAccess = Reflect.get(this, prop, proxy)

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
      childValue = childValue.$unwrap()
    }

    // Method and function props are all bound to the proxy and cached internally
    // so that accessing these props on the same proxy instance always returns the
    // same value, keeping memory reference integrity (real useful in libs such as
    // React).
    if (typeof childValue === "function") {
      if (!this.$bindings.has(childValue)) {
        this.$bindings.set(childValue, childValue.bind(proxy))
      }

      return this.$bindings.get(childValue) as unknown
    }

    if (!isProxiable(childValue)) {
      return childValue
    }

    return this.$children.has(childValue)
      ? this.$children.get(childValue)
      : this.$createChildNode(prop, childValue)
  }

  set(target: T, prop: string, newValue: unknown, proxy: INode<T>): boolean {
    // Automatically unwraps values when they are already Arbor nodes,
    // this prevents proxying proxies and thus forcing stale node references
    // to be kept in memmory unnecessarily.
    const value = isNode(newValue) ? newValue.$unwrap() : newValue

    // Ignores the mutation if new value is already the current value
    if (target[prop] === value) return true

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
      const childValue = Reflect.get(target, prop) as unknown

      this.$tree.mutate(this, (t: T) => {
        delete t[prop]

        return {
          operation: "delete",
          props: [prop],
        }
      })

      // TODO: Investigate the possibility of removing the line below.
      //
      // Here we preemptively remove the value from the state tree cache
      // however, we could leave it to the gargabe collector to free up the
      // unused objects given that $children is a WeakMap. I'd rather shoot
      // for simplicity if this line isn't providing any actual value
      this.$children.delete(childValue as object)
    }

    return true
  }

  protected $createChildNode<V extends object>(
    prop: string,
    value: V
  ): INode<V> {
    const childPath = this.$path.child(prop)
    const childNode = this.$tree.createNode(childPath, value)
    return this.$children.set(value, childNode)
  }
}
