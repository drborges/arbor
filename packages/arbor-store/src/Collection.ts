/* eslint-disable no-restricted-syntax */
import { Node } from "./types"

export type Predicate<T> = (item: T) => boolean
export interface Record {
  id: string
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

  merge(item: T, data: Partial<T>): T {
    const node = this as unknown as Node<T>
    if (node.$tree.getNodeAt(node.$path.child(item.id)) === undefined)
      return undefined

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
    if (typeof idOrItem === "string") {
      const item = this[idOrItem]

      return item != null ? this.reload(item) : undefined
    }

    if (typeof idOrItem === "object" && idOrItem.id) {
      return this.reload(idOrItem)
    }

    return undefined
  }

  reload(item: T): T {
    const node = this as unknown as Node<T>
    const itemPath = node.$path.child(item.id)
    return node.$tree.getNodeAt(itemPath)
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

  includes(item: T): boolean {
    for (const i of this) {
      if (i.id === item.id) return true
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

  delete(item: T) {
    let deleted: T
    const node = this as unknown as Node<T>

    node.$tree.mutate<Collection<T>>(node.$path, (collection) => {
      deleted = collection[item.id]
      delete collection[item.id]
    })

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

  $clone(): Collection<T> {
    return new Collection(...this)
  }
}
