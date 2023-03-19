import NodeHandler from "./NodeHandler"

export default class NodeArrayHandler<
  T extends object = object,
  K extends object = object
> extends NodeHandler<T[], K> {
  static accepts(value: any) {
    return Array.isArray(value)
  }

  deleteProperty(_target: T[], prop: string): boolean {
    if (this.$tree.isStale(this)) return true

    this.$tree.mutate(this, (node: T[]) => {
      node.splice(parseInt(prop, 10), 1)

      return {
        operation: "delete",
        props: [prop],
      }
    })

    this.$children.reset()

    return true
  }

  push(...item: T[]): number {
    if (this.$tree.isStale(this)) return 0

    let size: number

    this.$tree.mutate(this, (node: T[]) => {
      size = node.push(...item)

      return {
        operation: "push",
        props: [String(size - 1)],
      }
    })

    return size
  }

  reverse() {
    if (this.$tree.isStale(this)) return this

    this.$tree.mutate(this, (node: T[]) => {
      node.reverse()

      return {
        operation: "reverse",
        props: [],
      }
    })

    this.$children.reset()

    return this.$tree.getNodeAt(this.$path)
  }

  pop(): T {
    if (this.$tree.isStale(this)) return undefined

    let popped: T

    this.$tree.mutate(this, (node: T[]) => {
      const poppedIndex = node.length - 1
      popped = node.pop()

      return {
        operation: "pop",
        props: [String(poppedIndex)],
      }
    })

    this.$children.delete(popped)

    return popped
  }

  shift(): T {
    if (this.$tree.isStale(this)) return undefined

    let shifted: T

    this.$tree.mutate(this, (node: T[]) => {
      shifted = node.shift()

      return {
        operation: "shift",
        props: [],
      }
    })

    this.$children.reset()

    return shifted
  }

  sort(compareFn: (a: T, b: T) => number) {
    if (this.$tree.isStale(this)) return this

    this.$tree.mutate(this, (node: T[]) => {
      node.sort(compareFn)

      return {
        operation: "sort",
        props: [],
      }
    })

    this.$children.reset()

    return this.$tree.getNodeAt(this.$path)
  }

  splice(start: number, deleteCount: number, ...items: T[]): T[] {
    if (this.$tree.isStale(this)) return []

    let deleted: T[] = []

    this.$tree.mutate(this, (node: T[]) => {
      deleted = node.splice(start, deleteCount, ...items)

      return {
        operation: "splice",
        props: Array(deleteCount)
          .fill(0)
          .map((_, i) => String(start + i)),
      }
    })

    this.$children.reset()

    return deleted
  }

  unshift(...items: T[]): number {
    if (this.$tree.isStale(this)) return 0

    let size: number

    this.$tree.mutate(this, (node: T[]) => {
      size = node.unshift(...items)

      return {
        operation: "unshift",
        props: items.map((_, i) => String(i)),
      }
    })

    this.$children.reset()

    return size
  }
}
