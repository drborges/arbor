import { Node } from "../types"
import { pathFor } from "../utilities"
import { DefaultHandler } from "./default"

export class ArrayHandler<T extends object = object> extends DefaultHandler<
  Node<T>[]
> {
  static accepts(value: unknown) {
    return Array.isArray(value)
  }

  deleteProperty(target: T[], prop: string): boolean {
    this.$tree.detachNodeFor(target[prop])

    this.$tree.mutate(this, (node: T[]) => {
      node.splice(parseInt(prop, 10), 1)

      return {
        operation: "delete",
        props: [prop],
      }
    })

    this.refreshChildrenLinks({ from: parseInt(prop) })

    return true
  }

  push(...item: T[]): number {
    let size: number

    this.$tree.mutate(this, (node: T[]) => {
      size = node.push(...item)

      return {
        operation: "push",
        props: [],
      }
    })

    return size
  }

  reverse() {
    this.$tree.mutate(this, (node: T[]) => {
      node.reverse()

      return {
        operation: "reverse",
        props: [],
      }
    })

    this.refreshChildrenLinks()

    return this.$tree.getNodeAt<Node<T>[]>(pathFor(this))
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

    this.$tree.detachNodeFor(popped)

    return popped
  }

  shift(): T {
    let shifted: T

    this.$tree.mutate(this, (node: T[]) => {
      shifted = node.shift()

      return {
        operation: "shift",
        props: ["0"],
      }
    })

    this.$tree.detachNodeFor(shifted)
    this.refreshChildrenLinks()

    return shifted
  }

  sort(compareFn: (a: T, b: T) => number) {
    this.$tree.mutate(this, (node: T[]) => {
      node.sort(compareFn)

      return {
        operation: "sort",
        props: [],
      }
    })

    this.refreshChildrenLinks()

    return this.$tree.getNodeAt(pathFor(this))
  }

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

    deleted.forEach(this.$tree.detachNodeFor.bind(this.$tree))
    this.refreshChildrenLinks({ from: start })
    return deleted
  }

  unshift(...items: T[]): number {
    let size: number

    this.$tree.mutate(this, (node: T[]) => {
      size = node.unshift(...items)

      return {
        operation: "unshift",
        props: [],
      }
    })

    this.refreshChildrenLinks()

    return size
  }

  private refreshChildrenLinks({ from = 0 } = {}) {
    const node = this.$tree.getNodeFor(this.$value)
    for (let i = from; i < node.length; i++) {
      this.$tree.attachNode(node[i], i.toString())
    }
  }
}
