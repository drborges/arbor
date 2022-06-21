import Path from "./Path"
import clone from "./clone"
import isNode from "./isNode"
import { ArborProxiable } from "./proxiable"
import { ArborNode, INode } from "./Arbor"
import { ArborError, MissingUUIDError, NotAnArborNodeError } from "./errors"
import type { Mutation } from "./mutate"

export type Predicate<T> = (item: T) => boolean
export interface Item {
  uuid: string
}

function extractUUIDFrom(value?: string | Item): string {
  if (typeof value === "string") return value
  if (value?.uuid != null) return value.uuid

  throw new ArborError(
    "Expected either a UUID or an object that implements the collection Item interface"
  )
}

export default class Collection<T extends Item> {
  constructor(...items: T[]) {
    items.forEach((item) => {
      this[item.uuid] = item
    })
  }

  get [ArborProxiable]() {
    return true
  }

  push(...item: T[]): ArborNode<T>
  push(...items: T[]): ArborNode<T>[]
  push(...items: T[]): any {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    const newItems = items.filter((item) => {
      if (item.uuid == null) {
        throw new MissingUUIDError()
      }

      return !this.includes(item)
    })

    if (newItems.length > 0) {
      this.mutate(node, (collection) => {
        newItems.forEach((item) => {
          collection[item.uuid] = item
        })

        return {
          operation: "push",
          props: newItems.map((item) => item.uuid),
        }
      })
    }

    if (items.length > 1) {
      return items.map((item) =>
        this.getAt(node.$path.child(item.uuid))
      )
    }

    return this.getAt(node.$path.child(items[0].uuid))
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

  merge(uuid: string, data: Partial<T>): ArborNode<T>
  merge(item: T, data: Partial<T>): ArborNode<T>
  merge(uuidOrItem: T | string, data: Partial<T>): ArborNode<T>
  merge(uuidOrItem: any, data: Partial<T>): ArborNode<T> {
    const node = this
    if (!isNode(node)) throw new NotAnArborNodeError()

    const item = this.fetch(uuidOrItem) as T

    if (item === undefined) {
      return undefined
    }

    delete data.uuid

    this.mutate(node, (collection) => {
      collection[item.uuid] = clone(item, {
        ...data,
      })

      return {
        operation: "merge",
        props: [item.uuid],
      }
    })

    return this.getAt(node.$path.child(item.uuid))
  }

  mergeBy(
    predicate: Predicate<ArborNode<T>>,
    updateFn: (item: ArborNode<T>) => Partial<T>
  ): ArborNode<T>[] {
    const node = this
    const affectedUUIDs: string[] = []
    if (!isNode(node)) throw new NotAnArborNodeError()

    this.mutate(node, (collection) => {
      Object.values(collection).forEach((value) => {
        if (predicate(value)) {
          collection[value.uuid] = clone(value, {
            ...updateFn(value)
          })

          affectedUUIDs.push(value.uuid)
        }
      })

      return {
        operation: "mergeBy",
        props: affectedUUIDs,
      }
    })

    return affectedUUIDs.map((uuid) =>
      this.getAt(node.$path.child(uuid))
    )
  }

  fetch(item: T): ArborNode<T> | undefined
  fetch(uuid: string): ArborNode<T> | undefined
  fetch(uuidOrItem: string | T): ArborNode<T> | undefined
  fetch(uuidOrItem: any): ArborNode<T> | undefined {
    const uuid = extractUUIDFrom(uuidOrItem)
    const node = this

    if (!isNode(node)) return this[uuid]

    return uuid ? node.$tree.getNodeAt(node.$path.child(uuid)) : undefined
  }

  get length(): number {
    return Object.keys(this).length
  }

  includes(uuid: string): boolean
  includes(item: T): boolean
  includes(uuidOrItem: string | T): boolean
  includes(uuidOrItem: any): boolean {
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

  delete(item: T): T
  delete(uuid: string): T
  delete(uuidOrItem: string | T): T
  delete(uuidOrItem: any): T {
    let deleted: T
    const uuid = extractUUIDFrom(uuidOrItem)

    if (uuid) {
      this.mutate(this, (collection) => {
        deleted = collection[uuid]
        delete collection[uuid]

        return {
          operation: "delete",
          props: [uuid],
        }
      })
    }

    return deleted
  }

  deleteBy(predicate: Predicate<T>): T[] {
    const deleted: T[] = []

    this.mutate(this, (collection) => {
      Object.values(collection).forEach((value: T) => {
        if (predicate(value)) {
          delete collection[value.uuid]
          deleted.push(value)
        }
      })

      return {
        operation: "deleteBy",
        props: deleted.map((item) => item.uuid),
      }
    })

    return deleted
  }

  clear() {
    this.mutate(this, (collection) => {
      Object.keys(collection).forEach((key) => {
        delete collection[key]
      })

      return {
        operation: "clear",
        props: [],
      }
    })
  }

  *[Symbol.iterator](): Generator<T, any, undefined> {
    for (const key of Object.keys(this)) {
      yield this[key]
    }
  }

  protected mutate(node: ArborNode<T> | this, mutation: Mutation<T>) {
    if (!isNode(node)) throw new NotAnArborNodeError()
    node.$tree.mutate(node, mutation)
  }

  protected getAt(path: Path): INode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()
    return this.$tree.getNodeAt(path)
  }
}
