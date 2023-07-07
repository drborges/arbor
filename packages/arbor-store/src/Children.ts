import type { Node } from "./types"
import { seedFrom } from "./utilities"

export class Children {
  #nodes = new WeakMap<object, Node>()

  delete(value: object): boolean {
    return this.#nodes.delete(seedFrom(value))
  }

  has(value: object): boolean {
    return this.#nodes.has(seedFrom(value))
  }

  get<V extends object>(value: object): Node<V> {
    return this.#nodes.get(seedFrom(value)) as Node<V>
  }

  set<V extends object>(node: Node<V>): Node<V> {
    this.#nodes.set(seedFrom(node), node)
    return node
  }

  reset(): void {
    this.#nodes = new WeakMap<object, Node>()
  }
}
