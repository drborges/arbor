/* eslint-disable no-restricted-syntax */
import { Node } from "./types"

export type Predicate<T> = (item: T) => boolean
export interface Record {
  id: string
}

function extractIdFrom(value: string | Record): string {
  if (typeof value === "string") return value
  return value?.id
}

export default class Collection<T extends Record> {
  constructor(...items: T[]) {
    items.forEach((item) => {
      this[item.id] = item
    })
  }

  addMany(...items: T[]): T[] {
    const node = this as unknown as Node<T>

    items.forEach((item) => {
      if (item.id == null) {
        throw new Error("Collection items must have a string id")
      }
    })

    node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
      items.forEach((item) => {
        collection[item.id] = item
      })
    })

    return items.map((item) => node.$tree.getNodeAt(node.$path.child(item.id)))
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

  merge(idOrItem: T | string, data: Partial<T>): T {
    const item = this.fetch(idOrItem)
    const node = this as unknown as Node<T>

    if (item === undefined) {
      return undefined
    }

    delete data.id

    node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
      collection[item.id] = {
        ...item,
        ...data,
      }
    })

    return node.$tree.getNodeAt(node.$path.child(item.id))
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

          collection[value.id] = newValue
          updatedIds.push(value.id)
        }
      })
    })

    return updatedIds.map((id) => node.$tree.getNodeAt(node.$path.child(id)))
  }

  fetch(idOrItem: string | T): T | undefined {
    const id = extractIdFrom(idOrItem)
    const node = this as unknown as Node<T>

    return id ? node.$tree.getNodeAt(node.$path.child(id)) : undefined
  }

  get values(): T[] {
    return Object.values(this)
  }

  get ids(): string[] {
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

  includes(idOrItem: string | T): boolean {
    const id = extractIdFrom(idOrItem)

    if (id === undefined) return false

    for (const i of this) {
      if (i.id === id) return true
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

  delete(idOrItem: string | T) {
    let deleted: T
    const node = this as unknown as Node<T>
    const id = extractIdFrom(idOrItem)

    if (id) {
      node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
        deleted = collection[id]
        delete collection[id]
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
          delete collection[value.id]
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
