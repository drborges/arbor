import Path from "./Path"
import isNode from "./isNode"
import NodeCache from "./NodeCache"
import { clone, clonable } from "./cloning"
import type { Node, IStateTree } from "./types"

export default class NodeHandler<T extends object> implements ProxyHandler<T> {
  constructor(
    public readonly $tree: IStateTree,
    protected readonly $path: Path,
    protected readonly $value: T,
    readonly $children = new NodeCache()
  ) {}

  $unwrap(): T {
    return this.$value
  }

  $clone(): Node<T> {
    return this.$tree.createNode(this.$path, clone(this.$value), this.$children)
  }

  get(target: T, prop: string, proxy: Node<T>) {
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
      return childValue.bind(proxy)
    }

    if (!clonable(childValue)) {
      return childValue
    }

    return this.$children.has(childValue)
      ? this.$children.get(childValue)
      : this.$createChildNode(prop, childValue)
  }

  set(target: T, prop: string, newValue: any, proxy: Node<T>): boolean {
    // Ignores the mutation if new value is the current value
    if (proxy[prop] === newValue || target[prop] === newValue) return true

    const unwrapped = isNode(newValue) ? newValue.$unwrap() : newValue
    const value = clonable(unwrapped) ? clone(unwrapped) : unwrapped

    this.$tree.mutate(this.$path, (t: T) => {
      t[prop] = value
    })

    return true
  }

  deleteProperty(target: T, prop: string): boolean {
    const childValue = Reflect.get(target, prop)

    if (prop in target) {
      this.$tree.mutate(this.$path, (t: T) => {
        delete t[prop]
      })

      this.$children.delete(childValue)
    }

    return true
  }

  private $createChildNode<V extends object>(prop: string, value: V): Node<V> {
    const childPath = this.$path.child(prop)
    const childNode = this.$tree.createNode(childPath, value)
    return this.$children.set(value, childNode)
  }
}
