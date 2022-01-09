export interface Record {
  id: string
}

export default class Collection<T extends Record> {
  constructor(items: T[] = []) {
    items.forEach((item) => this.push(item))
  }

  push(item: T): number {
    this[item.id] = item
    return Object.keys(this).length
  }

  map<K>(transform: (item: T) => K): K[] {
    return [...this].map(transform)
  }

  filter(predicate: (item: T) => boolean): T[] {
    return [...this].filter(predicate)
  }

  get first(): T {
    return [...this][0]
  }

  get last(): T {
    const items = [...this]
    return items[items.length - 1]
  }

  reverse(): T[] {
    return [...this].reverse()
  }

  pop() {
    return [...this].pop()
  }

  shift() {
    return [...this].shift()
  }

  sort(compare: (a: T, b: T) => number): T[] {
    return [...this].sort(compare)
  }

  slice(start: number, end: number) {
    return [...this].slice(start, end)
  }

  delete(item: T) {
    delete this[item.id]
  }

  *[Symbol.iterator]() {
    // eslint-disable-next-line no-restricted-syntax
    for (const value of Object.values(this) as T[]) {
      yield value
    }
  }

  static from<K extends Record>(collection: Collection<K>) {
    return new Collection([...collection])
  }

  $clone(): Collection<T> {
    return Collection.from(this)
  }
}
