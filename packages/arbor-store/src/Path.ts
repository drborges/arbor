import { InvalidArgumentError, NotAnArborNodeError } from "./errors"
import { isNode } from "./guards"
import type { ArborNode, Node } from "./types"

/**
 * Represent a path within the state tree.
 *
 * Paths point to potential nodes within the state tree.
 */
export class Path {
  readonly segments: object[]

  /**
   * Creates a new instance of Path.
   *
   * @param values list of node values representing a path within a state tree
   * @returns a new instance of Path.
   */
  private constructor(...segments: object[]) {
    this.segments = segments
  }

  child(value: object): Path {
    return new Path(...this.segments.concat([value]))
  }

  walk<T extends object = object>(
    node: ArborNode<object>,
    cb?: (child: Node, parent: Node) => void
  ): Node<T> {
    try {
      if (!isNode(node)) {
        throw new NotAnArborNodeError()
      }

      return this.segments.reduce<Node>((parent, part) => {
        const child = parent.$children.get(part)

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

    return new Path(...this.segments.slice(0, this.segments.length - 1))
  }

  affects(pathOrNode: Path | ArborNode<object>): boolean {
    if (!isNode(pathOrNode) && !(pathOrNode instanceof Path)) {
      throw new InvalidArgumentError(
        "Argument must be either an instance of Path or an ArborNode"
      )
    }

    const path = isNode(pathOrNode) ? pathOrNode.$path : pathOrNode

    return path.segments.every(
      (segment, index) => segment === this.segments[index]
    )
  }

  matches(pathOrNode: Path | ArborNode<object>) {
    if (!isNode(pathOrNode) && !(pathOrNode instanceof Path)) {
      throw new InvalidArgumentError(
        "Argument must be either an instance of Path or an ArborNode"
      )
    }

    const path = isNode(pathOrNode) ? pathOrNode.$path : pathOrNode

    if (path.segments.length !== this.segments.length) {
      return false
    }

    return path.segments.every(
      (segment, index) => this.segments[index] === segment
    )
  }

  /**
   * Checks if the path points to the root of a state tree.
   *
   * @returns true if the path points to the root of a state tree, false otherwise.
   */
  isRoot() {
    return this.segments.length === 0
  }
}
