/* eslint-disable no-restricted-syntax */
import type { Node } from "./types"

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

  addMany(...items: T[]): T[] {
    const node = this as unknown as Node<T>

    items.forEach((item) => {
      if (item.uuid == null) {
        throw new Error("Collection items must have a string 'uuid'")
      }
    })

    node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
      items.forEach((item) => {
        collection[item.uuid] = item
      })
    })

    return items.map((item) =>
      node.$tree.getNodeAt(node.$path.child(item.uuid))
    )
  }

  add(item: T): T {
    return this.addMany(item)[0]
  }

  map<K>(transform: (item: T) => K): K[] {
    const mapped = []

    for (const item of this) {
      mapped.push(transform(item))
    }

    return mapped
  }

  filter(predicate: Predicate<T>): T[] {
    const collected = []

    for (const item of this) {
      if (predicate(item)) {
        collected.push(item)
      }
    }

    return collected
  }

  find(predicate: Predicate<T>): T {
    for (const item of this) {
      if (predicate(item)) return item
    }

    return undefined
  }

  merge(uuidOrItem: T | string, data: Partial<T>): T {
    const item = this.fetch(uuidOrItem)
    const node = this as unknown as Node<T>

    if (item === undefined) {
      return undefined
    }

    delete data.uuid

    node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
      collection[item.uuid] = {
        ...item,
        ...data,
      }
    })

    return node.$tree.getNodeAt(node.$path.child(item.uuid))
  }

  mergeBy(predicate: Predicate<T>, updateFn: (item: T) => Partial<T>): T[] {
    const updatedIds: string[] = []
    const node = this as unknown as Node<T>

    node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
      Object.values(collection).forEach((value: T) => {
        if (predicate(value)) {
          const newValue = {
            ...value,
            ...updateFn(value),
          }

          collection[value.uuid] = newValue
          updatedIds.push(value.uuid)
        }
      })
    })

    return updatedIds.map((uuid) =>
      node.$tree.getNodeAt(node.$path.child(uuid))
    )
  }

  fetch(uuidOrItem: string | T): T | undefined {
    const uuid = extractUUIDFrom(uuidOrItem)
    const node = this as unknown as Node<T>

    return uuid ? node.$tree.getNodeAt(node.$path.child(uuid)) : undefined
  }

  get values(): T[] {
    return Object.values(this)
  }

  get uuids(): string[] {
    return Object.keys(this)
  }

  get first(): T {
    let first: T

    for (first of this) {
      break
    }

    return first
  }

  get last(): T {
    let last: T

    for (const item of this) {
      last = item
    }

    return last
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

  some(predicate: Predicate<T>): boolean {
    for (const item of this) {
      if (predicate(item)) return true
    }

    return false
  }

  every(predicate: (item: T) => boolean): boolean {
    for (const item of this) {
      if (!predicate(item)) return false
    }

    return true
  }

  sort(compare: (a: T, b: T) => number): T[] {
    return Object.values(this).sort(compare)
  }

  slice(start: number, end: number) {
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
    let deleted: T
    const node = this as unknown as Node<T>
    const uuid = extractUUIDFrom(uuidOrItem)

    if (uuid) {
      node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
        deleted = collection[uuid]
        delete collection[uuid]
      })
    }

    return deleted
  }

  deleteBy(predicate: Predicate<T>): T[] {
    const deleted: T[] = []
    const node = this as unknown as Node<T>

    node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
      Object.values(collection).forEach((value: T) => {
        if (predicate(value)) {
          delete collection[value.uuid]
          deleted.push(value)
        }
      })
    })

    return deleted
  }

  clear() {
    const node = this as unknown as Node<T>
    node.$tree.mutate(node.$path, (collection) => {
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
