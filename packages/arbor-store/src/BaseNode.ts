import isNode from "./isNode"
import { ArborProxiable } from "./proxiable"
import { ArborError, NotAnArborNodeError } from "./errors"

import type { AttributesOf, INode } from "./Arbor"

export default class BaseNode<T extends object> {
  static from<K extends object>(data: Partial<K>): K {
    return Object.assign(new this(), data) as unknown as K
  }

  get [ArborProxiable]() {
    return true
  }

  parent<K extends object>(): INode<K> {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    const parentPath = node.$path.parent

    if (parentPath === null) {
      return undefined
    }

    return node.$tree.getNodeAt(parentPath)
  }

  detach() {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()
    if (node.$path.isRoot())
      throw new ArborError("Cannot detach store's root node")

    const id = node.$path.props[node.$path.props.length - 1]
    delete this.parent()[id]
  }

  attach(): BaseNode<T> {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    const parentPath = node.$path.parent
    const id = node.$path.props[node.$path.props.length - 1]
    node.$tree.mutate(parentPath, (parent) => {
      parent[id] = node.$unwrap()
      return {
        operation: "attach",
        props: [id],
      }
    })

    return node.$tree.getNodeAt(node.$path)
  }

  merge(attributes: Partial<AttributesOf<T>>): BaseNode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()

    this.$tree.mutate(this, (value) => {
      Object.assign(value, attributes)
      return {
        operation: "merge",
        props: Object.keys(attributes),
      }
    })

    return this.$tree.getNodeAt(this.$path)
  }

  reload(): BaseNode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()

    return this.$tree.getNodeAt(this.$path)
  }

  isAttached(): boolean {
    return this.reload() != null
  }

  isStale(): boolean {
    return this !== this.reload()
  }

  get path(): string {
    if (!isNode(this)) throw new NotAnArborNodeError()

    return this.$path.toString()
  }
}
