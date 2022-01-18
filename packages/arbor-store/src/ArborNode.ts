import isNode from "./isNode"

import type { AttributesOf, Node } from "./types"

export default class ArborNode<T extends object> {
  constructor(attributes: Partial<AttributesOf<T>> = {}) {
    Object.assign(this, attributes)
  }

  detach() {
    const node = this as unknown as Node<T>
    if (!isNode(node)) return

    const parentPath = node.$path.parent
    const id = node.$path.props[node.$path.props.length - 1]
    node.$tree.mutate(parentPath, (parent) => {
      delete parent[id]
    })
  }

  attach(): ArborNode<T> {
    const node = this as unknown as Node<T>
    if (!isNode(node)) return this

    const parentPath = node.$path.parent
    const id = node.$path.props[node.$path.props.length - 1]
    node.$tree.mutate(parentPath, (parent) => {
      parent[id] = node.$unwrap()
    })

    return node.$tree.getNodeAt(node.$path)
  }

  merge(attributes: Partial<AttributesOf<T>>): ArborNode<T> {
    const node = this as unknown as Node<T>
    if (!isNode(node)) return this

    node.$tree.mutate(node.$path, (value) => {
      Object.assign(value, attributes)
    })

    return node.$tree.getNodeAt(node.$path)
  }

  reload(): ArborNode<T> {
    const node = this as unknown as Node<T>
    return isNode(node) ? node.$tree.getNodeAt(node.$path) : this
  }

  isAttached(): boolean {
    return this.reload() != null
  }

  isStale(): boolean {
    return this !== this.reload()
  }

  get path(): string {
    const node = this as unknown as Node<T>
    return node.$path.toString()
  }
}
