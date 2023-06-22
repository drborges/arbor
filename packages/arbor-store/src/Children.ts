import { Node } from "./Arbor"

export default class Children {
  #nodes = new WeakMap<object, Node>()

  delete(value: object): boolean {
    return this.#nodes.delete(value)
  }

  has(value: object): boolean {
    return this.#nodes.has(value)
  }

  get<V extends object>(value: object): Node<V> {
    return this.#nodes.get(value) as Node<V>
  }

  set<V extends object>(value: object, node: Node<V>): Node<V> {
    this.#nodes.set(value, node)
    return node
  }

  reset(): void {
    this.#nodes = new WeakMap<object, Node>()
  }
}
