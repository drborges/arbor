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
    if (this.isDetached()) throw new StaleNodeError()

    const parentPath = this.$path.parent

    if (parentPath === null) {
      return undefined
    }

    return this.$tree.getNodeAt(parentPath)
  }

  detach() {
    if (!isNode(this)) throw new NotAnArborNodeError()
    if (this.isDetached()) throw new StaleNodeError()

    if (this.$path.isRoot())
      throw new ArborError("Cannot detach store's root node")

    const id = this.$path.props[this.$path.props.length - 1]
    delete this.parent()[id]
  }

  merge(attributes: Partial<AttributesOf<T>>): ArborNode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()
    if (this.isDetached()) throw new StaleNodeError()

    this.$tree.mutate(this, (value) => {
      Object.assign(value, attributes)
      return {
        operation: "merge",
        props: Object.keys(attributes),
      }
    })

    return this.$tree.getNodeAt(this.$path)
  }

  isDetached(): boolean {
    if (!isNode(this)) throw new NotAnArborNodeError()

    return this.$tree.isDetached(this)
  }

  get path(): Path {
    if (!isNode(this)) throw new NotAnArborNodeError()
    if (this.isDetached()) throw new StaleNodeError()

    return this.$path
  }
}
