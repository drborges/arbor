import isNode from "./isNode"
import { ArborProxy } from "./proxiable"
import { NotAnArborNodeError } from "./errors"

import type { AttributesOf } from "./Arbor"

export default class ArborNode<T extends object> {
  constructor(attributes: Partial<AttributesOf<T>> = {}) {
    Object.assign(this, attributes)
  }

  get [ArborProxy]() {
    return true
  }

  detach() {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    const parentPath = node.$path.parent
    const id = node.$path.props[node.$path.props.length - 1]
    node.$tree.mutate(parentPath, (parent) => {
      delete parent[id]
    })
  }

  attach(): ArborNode<T> {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    const parentPath = node.$path.parent
    const id = node.$path.props[node.$path.props.length - 1]
    node.$tree.mutate(parentPath, (parent) => {
      parent[id] = node.$unwrap()
    })

    return node.$tree.getNodeAt(node.$path)
  }

  merge(attributes: Partial<AttributesOf<T>>): ArborNode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()

    this.$tree.mutate(this, (value) => {
      Object.assign(value, attributes)
    })

    return this.$tree.getNodeAt(this.$path)
  }

  reload(): ArborNode<T> {
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
