import Path from "./Path"
import clone from "./clone"
import isNode from "./isNode"
import Repository, { Record } from "./Repository"
import { ArborProxiable } from "./proxiable"
import { ArborNode, INode } from "./Arbor"
import { ArborError, MissingUUIDError, NotAnArborNodeError } from "./errors"
import type { Mutation } from "./mutate"

export type Predicate<T> = (item: T) => boolean

function extractUUIDFrom(value?: string | Record): string {
  if (typeof value === "string") return value
  if (value?.uuid != null) return value.uuid

  throw new ArborError(
    "Expected either a UUID or an object that implements the collection Item interface"
  )
}

export default class Collection<T extends Record> {
  items = new Repository<T>()

  constructor(...items: T[]) {
    items.forEach((item) => {
      this.items[item.uuid] = item
    })
  }

  get [ArborProxiable]() {
    return true
  }

  push(...item: T[]): ArborNode<T>
  push(...items: T[]): ArborNode<T>[]
  push(...items: T[]): any {
    const node = this.items
    if (!isNode(node)) throw new NotAnArborNodeError()

    const newItems = items.filter((item) => {
      if (item.uuid == null) {
        throw new MissingUUIDError()
      }

      return !this.includes(item)
    })

    if (newItems.length > 0) {
      this.mutate(node, (repository) => {
        newItems.forEach((item) => {
          repository[item.uuid] = item
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
    const node = this.items
    if (!isNode(node)) throw new NotAnArborNodeError()

    const item = this.fetch(uuidOrItem) as T

    if (item === undefined) {
      return undefined
    }

    delete data.uuid

    this.mutate(node, (repository) => {
      repository[item.uuid] = clone(item, {
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
    const node = this.items
    const affectedUUIDs: string[] = []
    if (!isNode(node)) throw new NotAnArborNodeError()

    this.mutate(node, (repository) => {
      for (const value of this) {
        const uuid = value.uuid as string

        if (predicate(value)) {
          repository[uuid] = clone(value, {
            ...updateFn(value)
          })

          affectedUUIDs.push(uuid)
        }
      }

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
    const node = this.items

    if (!isNode(node)) return node[uuid]

    return uuid ? node.$tree.getNodeAt(node.$path.child(uuid)) : undefined
  }

  get length(): number {
    return Object.keys(this.items).length
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
    return Object.values(this.items).sort(compare)
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
      this.mutate(this.items, (repository) => {
        deleted = repository[uuid] as T
        delete repository[uuid]

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

    this.mutate(this.items, (repository) => {
      for (const value of repository) {
        if (predicate(value)) {
          delete repository[value.uuid]
          deleted.push(value)
        }
      }

      return {
        operation: "deleteBy",
        props: deleted.map((item) => item.uuid),
      }
    })

    return deleted
  }

  clear() {
    this.mutate(this.items, (repository) => {
      Object.keys(repository).forEach((key) => {
        delete repository[key]
      })

      return {
        operation: "clear",
        props: [],
      }
    })
  }

  *[Symbol.iterator]() {
    for (const value of this.items) {
      yield value
    }
  }

  protected mutate<K extends object>(node: ArborNode<K> | this, mutation: Mutation<K>) {
    if (!isNode(node)) throw new NotAnArborNodeError()
    node.$tree.mutate(node, mutation)
  }

  protected getAt(path: Path): INode<T> {
    if (!isNode(this)) throw new NotAnArborNodeError()
    return this.$tree.getNodeAt(path)
  }
}
