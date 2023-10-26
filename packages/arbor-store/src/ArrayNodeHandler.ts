import { NodeHandler } from "./NodeHandler"

export class ArrayNodeHandler<T extends object = object> extends NodeHandler<
  T[]
> {
  static accepts(value: unknown) {
    return Array.isArray(value)
  }

  // TODO: apply "path healing" on children so their links reflect the new array state
  deleteProperty(target: T[], prop: string): boolean {
    this.$tree.deleteNodeFor(target[prop])

    this.$tree.mutate(this, (node: T[]) => {
      node.splice(parseInt(prop, 10), 1)

      return {
        operation: "delete",
        props: [prop],
      }
    })

    return true
  }

  push(...item: T[]): number {
    let size: number

    // TODO: Throw ValueAlreadyBoundError if value is already bound to a child path
    this.$tree.mutate(this, (node: T[]) => {
      size = node.push(...item)

      return {
        operation: "push",
        props: [String(size - 1)],
      }
    })

    return size
  }

  // TODO: apply "path healing" on children so their links reflect the new array state
  reverse() {
    this.$tree.mutate(this, (node: T[]) => {
      node.reverse()

      return {
        operation: "reverse",
        props: [],
      }
    })

    return this.$tree.getNodeAt(this.$path)
  }

  pop(): T {
    let popped: T

    this.$tree.mutate(this, (node: T[]) => {
      const poppedIndex = node.length - 1
      popped = node.pop()

      return {
        operation: "pop",
        props: [String(poppedIndex)],
      }
    })

    return popped
  }

  // TODO: apply "path healing" on children so their links reflect the new array state
  shift(): T {
    let shifted: T

    this.$tree.mutate(this, (node: T[]) => {
      shifted = node.shift()

      return {
        operation: "shift",
        props: ["0"],
      }
    })

    return shifted
  }

  // TODO: apply "path healing" on children so their links reflect the new array state
  sort(compareFn: (a: T, b: T) => number) {
    this.$tree.mutate(this, (node: T[]) => {
      node.sort(compareFn)

      return {
        operation: "sort",
        props: [],
      }
    })

    return this.$tree.getNodeAt(this.$path)
  }

  // TODO: apply "path healing" on children so their links reflect the new array state
  splice(start: number, deleteCount: number, ...items: T[]): T[] {
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

    return deleted
  }

  // TODO: apply "path healing" on children so their links reflect the new array state
  unshift(...items: T[]): number {
    let size: number

    this.$tree.mutate(this, (node: T[]) => {
      size = node.unshift(...items)

      return {
        operation: "unshift",
        props: [],
      }
    })

    return size
  }
}
