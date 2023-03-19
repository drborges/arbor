import Path from "./Path"
import isNode from "./isNode"
import { ArborProxiable } from "./isProxiable"
import { ArborError, NotAnArborNodeError, StaleNodeError } from "./errors"

import type { ArborNode, AttributesOf, INode } from "./Arbor"

export default class BaseNode<T extends object> {
  static from<K extends object>(data: Partial<K>): K {
    return Object.assign(new this(), data) as unknown as K
  }

  get [ArborProxiable]() {
    return true
  }

  parent<K extends object>(): INode<K> {
    if (!isNode(this)) throw new NotAnArborNodeError()
    if (this.isStale()) throw new StaleNodeError()

    const node = this
    const parentPath = node.$path.parent

    if (parentPath === null) {
      return undefined
    }

    return node.$tree.getNodeAt(parentPath)
  }

  detach() {
    if (!isNode(this)) throw new NotAnArborNodeError()
    if (this.isStale()) throw new StaleNodeError()

    const node = this
    if (node.$path.isRoot())
      throw new ArborError("Cannot detach store's root node")

    const id = node.$path.props[node.$path.props.length - 1]
    delete this.parent()[id]
  }

  merge(attributes: Partial<AttributesOf<T>>): ArborNode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()
    if (this.isStale()) throw new StaleNodeError()

    this.$tree.mutate(this, (value) => {
      Object.assign(value, attributes)
      return {
        operation: "merge",
        props: Object.keys(attributes),
      }
    })

    return this.$tree.getNodeAt(this.$path)
  }

  reload(): ArborNode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()
    if (this.isStale()) throw new StaleNodeError()

    return this.$tree.getNodeAt(this.$path)
  }

  isStale(): boolean {
    if (!isNode(this)) throw new NotAnArborNodeError()

    return this.$tree.isStale(this)
  }

  get path(): Path {
    if (!isNode(this)) throw new NotAnArborNodeError()
    if (this.isStale()) throw new StaleNodeError()

    return this.$path
  }
}
