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
    return Object.values(this).map(transform)
  }

  filter(predicate: Predicate<T>): T[] {
    return Object.values(this).filter(predicate)
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
    return Object.values(this)[0]
  }

  get last(): T {
    const items = Object.values(this)
    return items[items.length - 1]
  }

  get length(): number {
    return Object.keys(this).length
  }

  includes(item: T): boolean {
    return Object.values(this).some((i) => i.id === item.id)
  }

  some(predicate: (item: T) => boolean): boolean {
    return Object.values(this).some(predicate)
  }

  every(predicate: (item: T) => boolean): boolean {
    return Object.values(this).every(predicate)
  }

  sort(compare: (a: T, b: T) => number): T[] {
    return Object.values(this).sort(compare)
  }

  slice(start: number, end: number) {
    return Object.values(this).slice(start, end)
  }

  delete(item: T) {
    const reloadedItem = this.reload(item) as Node<T>
    if (!reloadedItem) return undefined

    delete this[reloadedItem.id]
    return reloadedItem.$unwrap()
  }

  deleteBy(predicate: Predicate<T>): T[] {
    return this.filter(predicate).map(this.delete)
  }

  *[Symbol.iterator]() {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(this)) {
      yield this[key]
    }
  }

  $clone(): Collection<T> {
    return new Collection(...this)
  }
}
