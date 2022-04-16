import { INode } from "./Arbor"

export default class NodeCache {
  #nodes = new WeakMap<object, INode>()

  delete(value: object): boolean {
    return this.#nodes.delete(value)
  }

  has(value: object): boolean {
    return this.#nodes.has(value)
  }

  get<V extends object>(value: object): INode<V> {
    return this.#nodes.get(value) as INode<V>
  }

  set<V extends object>(value: object, node: INode<V>): INode<V> {
    this.#nodes.set(value, node)
    return node
  }

  reset(): void {
    this.#nodes = new WeakMap<object, INode>()
  }
}
