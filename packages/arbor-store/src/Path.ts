import { InvalidArgumentError } from "./errors"
import { isNode } from "./guards"
import type { ArborNode } from "./types"

/**
 * Represent a path within the state tree.
 *
 * Paths point to potential nodes within the state tree.
 */
export default class Path {
  props: string[]

  /**
   * Creates a new instance of Path.
   *
   * @param props list of strings representing the path within an Arbor state tree.
   * @returns a new instance of Path.
   */
  constructor(...props: string[]) {
    this.props = props
  }

  /**
   * Parses a given path representation string into an actual Path instance.
   *
   * @example
   *
   * ```ts
   * const path = Path.parse("/users/3/name")
   * path.toString()
   * => "/users/3/name"
   * ```
   *
   * @param str string representation of a path.
   * @returns the instance of a Path for the given string.
   */
  static parse(str: string): Path {
    return new Path(...str.split("/").filter((part) => part !== ""))
  }

  /**
   * Returns a Path instance representing the root of an Arbor state tree.
   *
   * @example
   *
   * ```ts
   * const root = Path.root
   * root.toString()
   * => "/"
   * ```
   */
  static get root(): Path {
    return new Path()
  }

  /**
   * Returns a Path instance representing a child path under the current path.
   *
   * @example
   *
   * ```ts
   * const path = new Path("users", "3")
   * const child = path.child("name")
   * child.toString()
   * => "/users/3/name"
   * ```
   *
   * @param prop the child's subpath under the current path.
   * @returns a Path instance for the given child's subpath.
   */
  child(prop: string): Path {
    return new Path(...this.props.concat(prop.toString()))
  }

  /**
   * Traverses a given node until reaching the node represented by the path.
   *
   * @param node an Arbor node to traverse.
   * @param cb an optional callback that allows one to process intermediary nodes
   * intersected by the path.
   * @returns the node referenced by the path.
   */
  walk<T extends object>(
    node: object,
    cb?: (child: object, parent: object) => void
  ): T {
    try {
      return this.props.reduce((parent, part) => {
        const child = isNode(parent) ? parent.$traverse(part) : parent[part]
        if (cb) cb(child, parent)
        return child
      }, node)
    } catch {
      return undefined
    }
  }

  /**
   * Returns this path's parent Path.
   *
   * @example
   *
   * ```ts
   * const path = new Path("users", "3", "name")
   * const parent = path.parent
   * parent.toString()
   * => "/users/3"
   * ```
   */
  get parent(): Path {
    if (this.props.length === 0) {
      return null
    }

    return new Path(...this.props.slice(0, this.props.length - 1))
  }

  /**
   * Compares its value equality with a given path
   * @param path a path to compare to
   * @returns true if both paths have the same value, false otherwise
   */
  targets(pathOrNode: Path | ArborNode<object>) {
    if (pathOrNode instanceof Path) {
      return this.toString() === pathOrNode.toString()
    }

    if (isNode(pathOrNode)) {
      return this.toString() === pathOrNode.$path.toString()
    }

    throw new InvalidArgumentError(
      "Argument must be either an instance of Path or an ArborNode"
    )
  }

  /**
   * Checks whether or not mutations to this path affects the given ArborNode
   *
   * @param node the ArborNode to check for
   * @returns true if mutations to this path affects the given node, false otherwise
   */
  affects(pathOrNode: Path | ArborNode<object>): boolean {
    const path = isNode(pathOrNode) ? pathOrNode.$path : pathOrNode
    return this.toString().startsWith(path.toString())
  }

  /**
   * Computes the string representation of the path object.
   *
   * @example
   *
   * ```ts
   * const path = new Path("users", "3", "name")
   * path.toString()
   * => "/users/3/name"
   * ```
   *
   * @returns the string representation of the path.
   */
  toString(): string {
    return `/${this.props.join("/")}`
  }

  /**
   * Checks if the path points to the root of a state tree.
   *
   * @returns true if the path points to the root of a state tree, false otherwise.
   */
  isRoot() {
    return this.props.length === 0
  }

  get [Symbol.toStringTag]() {
    return this.toString()
  }
}
