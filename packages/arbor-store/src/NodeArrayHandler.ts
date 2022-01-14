import NodeHandler from "./NodeHandler"
import Path from "./Path"
import NodeCache from "./NodeCache"
import { IStateTree } from "./types"

export default class NodeArrayHandler<T extends object> extends NodeHandler<
  T[]
> {
  constructor(
    $tree: IStateTree,
    $path: Path,
    $value: T[],
    $children = new NodeCache()
  ) {
    super($tree, $path, $value, $children)
  }

  deleteProperty(_target: T[], prop: string): boolean {
    this.splice(parseInt(prop, 10), 1)
    return true
  }

  push(...item: T[]): number {
    let size: number

    this.$tree.mutate(this.$path, (node: T[]) => {
      size = node.push(...item)
    })

    return size
  }

  reverse() {
    this.$tree.mutate(this.$path, (node: T[]) => {
      node.reverse()
    })

    this.$children.reset()

    return this.$tree.getNodeAt(this.$path)
  }

  pop(): T {
    let popped: T

    this.$tree.mutate(this.$path, (node: T[]) => {
      popped = node.pop()
    })

    this.$children.delete(popped)

    return popped
  }

  shift(): T {
    let shifted: T

    this.$tree.mutate(this.$path, (node: T[]) => {
      shifted = node.shift()
    })

    this.$children.reset()

    return shifted
  }

  sort(compareFn: (a: T, b: T) => number): T[] {
    this.$tree.mutate(this.$path, (node: T[]) => {
      node.sort(compareFn)
    })

    this.$children.reset()

    return this.$tree.getNodeAt(this.$path)
  }

  splice(start: number, deleteCount: number, ...items: T[]): T[] {
    let deleted: T[] = []

    this.$tree.mutate(this.$path, (node: T[]) => {
      deleted = node.splice(start, deleteCount, ...items)
    })

    this.$children.reset()

    return deleted
  }

  unshift(...items: T[]): number {
    let size: number

    this.$tree.mutate(this.$path, (node: T[]) => {
      size = node.unshift(...items)
    })

    this.$children.reset()

    return size
  }
}
