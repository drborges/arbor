/* eslint-disable no-restricted-syntax */
import { ArborError } from "./errors"
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

  add(item: T): T {
    if (item.id == null) {
      throw new ArborError("Collection items must have a string id")
    }

    this[item.id] = item

    const node = this as unknown as Node<T>
    const newItemPath = node.$path.child(item.id)
    return node.$store().getNodeAt(newItemPath)
  }

  addMany(...items: T[]): T[] {
    items.forEach((item) => {
      if (item.id == null) {
        throw new ArborError("Collection items must have a string id")
      }
    })

    return items.map(this.add)
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
    if (this[item.id] == null) return undefined

    delete data.id

    this[item.id] = {
      ...item,
      ...data,
    }

    return this.reload(item)
  }

  mergeBy(predicate: Predicate<T>, updateFn: (item: T) => Partial<T>): T[] {
    return this.filter(predicate).map((item) =>
      this.merge(item, updateFn(item))
    )
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
    return node.$store().getNodeAt(itemPath)
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
    const reloadedItem = this.reload(item) as Node<T>
    if (!reloadedItem) return undefined

    delete this[reloadedItem.id]
    return reloadedItem.$unwrap()
  }

  deleteBy(predicate: Predicate<T>): T[] {
    const deleted: T[] = []

    for (const item of this) {
      if (predicate(item)) {
        deleted.push(this.delete(item))
      }
    }

    return deleted
  }

  clear() {
    this.deleteBy(() => true)
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
