import { Node, IStateTree } from "./types"
import Path from "./Path"
import proxiable from "./proxiable"
import NodeCache from "./NodeCache"
import { Clonable, isClonable } from "./Clonable"

export default class NodeHandler<T extends object> implements ProxyHandler<T> {
  constructor(
    protected readonly $tree: IStateTree,
    protected readonly $path: Path,
    protected readonly $value: T,
    readonly $children = new NodeCache()
  ) {}

  $unwrap(): T {
    return this.$value
  }

  $clone(): Node<T> {
    const clonable = this.$value as Clonable<T>
    const clone = isClonable(this.$value)
      ? clonable.$clone()
      : { ...this.$value }
    return this.$tree.createNode(this.$path, clone, this.$children)
  }

  $flush(): void {
    this.$children.reset()
  }

  get(target: T, prop: string, proxy: Node<T>) {
    // Access $unwrap, $clone, $children, etc...
    const handlerApiAccess = Reflect.get(this, prop, proxy)

    if (handlerApiAccess) {
      return handlerApiAccess
    }

    const childValue = Reflect.get(target, prop, proxy)

    if (typeof childValue === "function") {
      return childValue.bind(proxy)
    }

    if (!proxiable(childValue)) {
      return childValue
    }

    return this.$children.has(childValue)
      ? this.$children.get(childValue)
      : this.$createChildNode(prop, childValue)
  }

  set(_target: T, prop: string, newValue: any): boolean {
    this.$tree.mutate(this.$path, (t: T) => {
      t[prop] = newValue
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
