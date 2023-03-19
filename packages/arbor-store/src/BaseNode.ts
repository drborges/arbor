import Path from "./Path"
import isNode from "./isNode"
import { ArborProxiable } from "./isProxiable"
import { ArborError, NotAnArborNodeError } from "./errors"

import type { ArborNode, AttributesOf, INode } from "./Arbor"

export default class BaseNode<T extends object> {
  static from<K extends object>(data: Partial<K>): K {
    return Object.assign(new this(), data) as unknown as K
  }

  get [ArborProxiable]() {
    return true
  }

  // TODO: throw StaleNodeError when node is stale
  parent<K extends object>(): INode<K> {
    if (!isNode(this)) throw new NotAnArborNodeError()

    const node = this
    const parentPath = node.$path.parent

    if (parentPath === null) {
      return undefined
    }

    return node.$tree.getNodeAt(parentPath)
  }

  // TODO: throw StaleNodeError when node is stale
  detach() {
    if (!isNode(this)) throw new NotAnArborNodeError()

    const node = this
    if (node.$path.isRoot())
      throw new ArborError("Cannot detach store's root node")

    const id = node.$path.props[node.$path.props.length - 1]
    delete this.parent()[id]
  }

  attach(): ArborNode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()

    const node = this
    const parentPath = node.$path.parent
    const id = node.$path.props[node.$path.props.length - 1]
    node.$tree.mutate(parentPath, (parent) => {
      parent[id] = node.$unwrap()
      return {
        operation: "set",
        props: [id],
      }
    })

    return node.$tree.getNodeAt(node.$path)
  }

  merge(attributes: Partial<AttributesOf<T>>): ArborNode<T> {
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

  // TODO: throw StaleNodeError when node is stale
  reload(): ArborNode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()

    return this.$tree.getNodeAt(this.$path)
  }

  isAttached(): boolean {
    return this.reload() != null
  }

  isStale(): boolean {
    if (!isNode(this)) throw new NotAnArborNodeError()

    return this.$tree.isStale(this)
  }

  get path(): Path {
    if (!isNode(this)) throw new NotAnArborNodeError()

    return this.$path
  }
}
