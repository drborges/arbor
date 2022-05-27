import isNode from "./isNode"
import { ArborNode, INode } from "./Arbor"
import { ArborProxy } from "./proxiable"
import { MissingUUIDError, NotAnArborNodeError } from "./errors"

export type Predicate<T> = (item: T) => boolean
export interface Item {
  uuid: string
}

function extractUUIDFrom(value: string | Item): string {
  if (typeof value === "string") return value
  return value?.uuid
}

export default class Collection<T extends Item> {
  constructor(...items: T[]) {
    items.forEach((item) => {
      this[item.uuid] = item
    })
  }

  get [ArborProxy]() {
    return true
  }

  push(item: T): ArborNode<T>
  push(...items: T[]): ArborNode<T>[]
  push(...items: any): any {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    items.forEach((item) => {
      if (item.uuid == null) {
        throw new MissingUUIDError()
      }
    })

    node.$tree.mutate<Collection<T>>(
      node as INode<Collection<T>>,
      (collection) => {
        items.forEach((item) => {
          collection[item.uuid] = item
        })
      }
    )

    if (items.length > 1) {
      return items.map((item) =>
        node.$tree.getNodeAt(node.$path.child(item.uuid))
      )
    }

    return node.$tree.getNodeAt(node.$path.child(items[0].uuid))
  }

  map<K>(transform: (item: ArborNode<T>) => K): K[] {
    const mapped = []

    for (const item of this) {
      mapped.push(transform(item))
    }

    return mapped
  }

  forEach(cb: (item: ArborNode<T>) => void) {
    for (const item of this) {
      cb(item)
    }
  }

  filter(predicate: Predicate<ArborNode<T>>): ArborNode<T>[] {
    const collected = []

    for (const item of this) {
      if (predicate(item)) {
        collected.push(item)
      }
    }

    return collected
  }

  find(predicate: Predicate<ArborNode<T>>): ArborNode<T> {
    for (const item of this) {
      if (predicate(item)) return item
    }

    return undefined
  }

  merge(uuidOrItem: T | string, data: Partial<T>): ArborNode<T> {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    const item = this.fetch(uuidOrItem) as T

    if (item === undefined) {
      return undefined
    }

    delete data.uuid

    node.$tree.mutate<Collection<T>>(
      node as INode<Collection<T>>,
      (collection) => {
        collection[item.uuid] = {
          ...item,
          ...data,
        }
      }
    )

    return node.$tree.getNodeAt(node.$path.child(item.uuid))
  }

  mergeBy(
    predicate: Predicate<ArborNode<T>>,
    updateFn: (item: ArborNode<T>) => Partial<T>
  ): ArborNode<T>[] {
    const node = this
    const updatedIds: string[] = []
    if (!isNode(node)) throw new NotAnArborNodeError()

    node.$tree.mutate<Collection<T>>(
      node as INode<Collection<T>>,
      (collection) => {
        Object.values(collection).forEach((value) => {
          if (predicate(value)) {
            const newValue = {
              ...value,
              ...updateFn(value),
            }

            collection[value.uuid] = newValue
            updatedIds.push(value.uuid)
          }
        })
      }
    )

    return updatedIds.map((uuid) =>
      node.$tree.getNodeAt(node.$path.child(uuid))
    )
  }

  fetch(uuidOrItem: string | T): ArborNode<T> | undefined {
    const uuid = extractUUIDFrom(uuidOrItem)
    const node = this

    if (!isNode(node)) return this[uuid]

    return uuid ? node.$tree.getNodeAt(node.$path.child(uuid)) : undefined
  }

  get length(): number {
    return Object.keys(this).length
  }

  includes(uuidOrItem: string | T): boolean {
    const id = extractUUIDFrom(uuidOrItem)

    if (id === undefined) return false

    for (const i of this) {
      if (i.uuid === id) return true
    }

    return false
  }

  some(predicate: Predicate<ArborNode<T>>): boolean {
    for (const item of this) {
      if (predicate(item)) return true
    }

    return false
  }

  every(predicate: Predicate<ArborNode<T>>): boolean {
    for (const item of this) {
      if (!predicate(item)) return false
    }

    return true
  }

  sort(compare: (a: T, b: T) => number): ArborNode<T>[] {
    return Object.values(this).sort(compare)
  }

  slice(start: number, end: number): ArborNode<T>[] {
    let i = 0
    const slice = []

    for (const item of this) {
      if (i === end) {
        break
      }

      if (i >= start && i < end) {
        slice.push(item)
      }

      i++
    }

    return slice
  }

  delete(uuidOrItem: string | T) {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    let deleted: T
    const uuid = extractUUIDFrom(uuidOrItem)

    if (uuid) {
      node.$tree.mutate<Collection<T>>(
        node as INode<Collection<T>>,
        (collection) => {
          deleted = collection[uuid]
          delete collection[uuid]
        }
      )
    }

    return deleted
  }

  deleteBy(predicate: Predicate<T>): T[] {
    const node = this
    const deleted: T[] = []
    if (!isNode(node)) throw new NotAnArborNodeError()

    node.$tree.mutate<Collection<T>>(
      node as INode<Collection<T>>,
      (collection) => {
        Object.values(collection).forEach((value: T) => {
          if (predicate(value)) {
            delete collection[value.uuid]
            deleted.push(value)
          }
        })
      }
    )

    return deleted
  }

  clear() {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    node.$tree.mutate(node, (collection) => {
      Object.keys(collection).forEach((key) => {
        delete collection[key]
      })
    })
  }

  *[Symbol.iterator](): Generator<T, any, undefined> {
    for (const key of Object.keys(this)) {
      yield this[key]
    }
  }
}
