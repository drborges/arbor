import { InvalidArgumentError, NotAnArborNodeError } from "./errors"
import { isNode } from "./guards"
import type { ArborNode, Node } from "./types"
import { Seed, seedFrom } from "./utilities"

/**
 * Represent a path within the state tree.
 */
export class Path {
  readonly seeds: Seed[]

  /**
   * Creates a new instance of Path.
   *
   * @param values list of node values representing a path within a state tree
   * @returns a new instance of Path.
   */
  private constructor(...seeds: Seed[]) {
    this.seeds = seeds
  }

  child(value: object): Path {
    return new Path(...this.seeds.concat([seedFrom(value)]))
  }

  walk<T extends object = object>(
    node: ArborNode<object>,
    cb?: (child: Node, parent: Node) => void
  ): Node<T> {
    try {
      if (!isNode(node)) {
        throw new NotAnArborNodeError()
      }

      return this.seeds.reduce<Node>((parent, seed) => {
        const child = parent.$children.get(seed)

        if (cb) cb(child, parent)

        return child
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

  affects(pathOrNode: Path | ArborNode<object>): boolean {
    if (!isNode(pathOrNode) && !(pathOrNode instanceof Path)) {
      throw new InvalidArgumentError(
        "Argument must be either an instance of Path or an ArborNode"
      )
    }

    const path = isNode(pathOrNode) ? pathOrNode.$path : pathOrNode

    return path.seeds.every((seed, index) => seed === this.seeds[index])
  }

  matches(pathOrNode: Path | ArborNode<object>) {
    if (!isNode(pathOrNode) && !(pathOrNode instanceof Path)) {
      throw new InvalidArgumentError(
        "Argument must be either an instance of Path or an ArborNode"
      )
    }

    const path = isNode(pathOrNode) ? pathOrNode.$path : pathOrNode

    if (path.seeds.length !== this.seeds.length) {
      return false
    }

    return path.seeds.every((seed, index) => this.seeds[index] === seed)
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
