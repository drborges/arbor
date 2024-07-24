import { NotAnArborNodeError } from "../errors"
import { isNode } from "../guards"
import type { Node } from "../types"
import { Seed } from "./seed"

export class Path {
  readonly seeds: Seed[]

  /**
   * Creates a new instance of Path.
   *
   * @param seeds list of node seeds representing a path within a state tree
   * @returns a new instance of Path.
   */
  private constructor(...seeds: Seed[]) {
    this.seeds = seeds
  }

  static root(seed: Seed) {
    return new Path(seed)
  }

  child(seed: Seed): Path {
    return new Path(...this.seeds.concat([seed]))
  }

  walk<T extends object = object>(
    node: Node,
    visit: (_node: Node) => Node
  ): Node<T> {
    try {
      if (!isNode(node)) {
        throw new NotAnArborNodeError()
      }

      let targetNode = node
      const tree = node.$tree

      for (const seed of this.seeds) {
        targetNode = visit(tree.getNodeFor<T>(seed))
      }

      return targetNode as Node<T>
    } catch (e) {
      return undefined
    }
  }

  get parent(): Path {
    if (this.isRoot()) {
      return null
    }

    return new Path(...this.seeds.slice(0, this.seeds.length - 1))
  }

  /**
   * Checks if the path points to the root of a state tree.
   *
   * @returns true if the path points to the root of a state tree, false otherwise.
   */
  isRoot() {
    return this.seeds.length === 1
  }
}
