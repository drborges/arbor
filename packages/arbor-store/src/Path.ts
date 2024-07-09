import { Seed } from "./Seed"
import { InvalidArgumentError, NotAnArborNodeError } from "./errors"
import { isNode } from "./guards"
import type { ArborNode, Node, Visitor } from "./types"

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

  child(seed: Seed): Path {
    return new Path(...this.seeds.concat([seed]))
  }

  walk<T extends object = object>(
    node: ArborNode<object>,
    visit: Visitor = (child) => child
  ): Node<T> {
    try {
      if (!isNode(node)) {
        throw new NotAnArborNodeError()
      }

      return this.seeds.reduce<Node>((parent, seed) => {
        const child = parent.$tree.getNodeFor(seed)
        return visit(child, parent)
      }, node) as Node<T>
    } catch (e) {
      return undefined
    }
  }

  static get root() {
    return new Path()
  }

  get parent(): Path {
    if (this.isRoot()) {
      return null
    }

    return new Path(...this.seeds.slice(0, this.seeds.length - 1))
  }

  affects(node: ArborNode<object>): boolean {
    if (!isNode(node)) {
      throw new InvalidArgumentError("Argument must be an ArborNode")
    }
    const path = node.$tree.getPathFor(node)
    return path.seeds.every((seed, index) => seed === this.seeds[index])
  }

  matches(node: Path | ArborNode<object>) {
    if (!isNode(node)) {
      throw new InvalidArgumentError("Argument must be an ArborNode")
    }

    const path = node.$tree.getPathFor(node)
    const sameLength = path.seeds.length === this.seeds.length

    return this.affects(node) && sameLength
  }

  /**
   * Checks if the path points to the root of a state tree.
   *
   * @returns true if the path points to the root of a state tree, false otherwise.
   */
  isRoot() {
    return this.seeds.length === 0
  }
}
