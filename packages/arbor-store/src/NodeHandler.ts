import Path from "./Path"
import clone from "./clone"
import isNode from "./isNode"
import proxiable from "./proxiable"
import NodeCache from "./NodeCache"
import Arbor, { INode } from "./Arbor"
import Subscribers from "./Subscribers"

function memoizedFunctionBoundToProxy<T extends object>(
  target: T,
  prop: string,
  value: Function,
  proxy: INode<T>
) {
  const boundPropName = `bound_${prop.toString()}`
  const boundFn = Reflect.get(target, boundPropName, proxy)

  if (!boundFn) {
    Object.defineProperty(target, boundPropName, {
      enumerable: false,
      configurable: false,
      value: value.bind(proxy),
    })
  }

  return Reflect.get(target, boundPropName, proxy)
}

export default class NodeHandler<
  T extends object = object,
  K extends object = object
> implements ProxyHandler<T>
{
  constructor(
    readonly $tree: Arbor<K>,
    readonly $path: Path,
    readonly $value: T,
    readonly $children = new NodeCache(),
    readonly $subscribers = new Subscribers<T>()
  ) {}

  static accepts(_value: any) {
    return true
  }

  $unwrap(): T {
    return this.$value
  }

  $clone(): INode<T> {
    return this.$tree.createNode(
      this.$path,
      clone(this.$value),
      this.$subscribers,
      this.$children
    )
  }

  get(target: T, prop: string, proxy: INode<T>) {
    // Access $unwrap, $clone, $children, etc...
    const handlerApiAccess = Reflect.get(this, prop, proxy)

    // Allow proxied values to defined properties named 'get', 'set', 'deleteProperty'
    // without conflicting with the ProxyHandler API.
    if (handlerApiAccess && !["get", "set", "deleteProperty"].includes(prop)) {
      return handlerApiAccess
    }

    let childValue = Reflect.get(target, prop, proxy)

    if (isNode(childValue)) {
      childValue = childValue.$unwrap()
    }

    if (typeof childValue === "function") {
      return memoizedFunctionBoundToProxy<T>(target, prop, childValue, proxy)
    }

    if (!proxiable(childValue)) {
      return childValue
    }

    return this.$children.has(childValue)
      ? this.$children.get(childValue)
      : this.$createChildNode(prop, childValue)
  }

  set(target: T, prop: string, newValue: any, proxy: INode<T>): boolean {
    // Ignores the mutation if new value is the current value
    if (proxy[prop] === newValue || target[prop] === newValue) return true

    const unwrapped = isNode(newValue) ? newValue.$unwrap() : newValue
    const value = proxiable(unwrapped) ? clone(unwrapped) : unwrapped

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
    const childValue = Reflect.get(target, prop)

    if (prop in target) {
      this.$tree.mutate(this as unknown as INode<T>, (t: T) => {
        delete t[prop]

        return {
          operation: "delete",
          props: [prop],
        }
      })

      this.$children.delete(childValue)
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
