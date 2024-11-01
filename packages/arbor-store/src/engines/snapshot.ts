import { Seed } from "../path"
import { Node } from "../types"
import { parentOf } from "../utilities"
import { DefaultEngine } from "./default"

function clone<T extends object>(value: T): T {
  const clonedValue = cloneViaConstructor(value)
  Seed.plant(clonedValue, Seed.from(value))
  return clonedValue
}

function cloneViaConstructor<T extends object>(value: T): T {
  const constructor = value.constructor as new () => T
  const instance = new constructor()
  return Object.assign(instance, value)
}

export class SnapshotEngine<T extends object> extends DefaultEngine<T> {
  cloneNode<V extends object>(node: Node<V>): Node<V> {
    const parent = parentOf(node)
    const nodeValue = clone(node.$value)
    const path = this.tree.getPathFor(node)
    const link = this.tree.getLinkFor(node)

    if (parent) {
      parent.$setChildValue(link, nodeValue)
    }

    return this.tree.createNode<V>(path, nodeValue, link, node.$subscriptions)
  }
}
