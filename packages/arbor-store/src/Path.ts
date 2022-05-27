import isNode from "./isNode"
import { ArborNode } from "./Arbor"
import { InvalidArgumentError, NotAnArborNodeError } from "./errors"

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
   * Traverses a given object until reaching the node represented by the path.
   *
   * @param obj object to be traversed
   * @returns the node within obj represented by the path
   */
  walk<T extends object, V extends object>(obj: T): V {
    return this.props.reduce<T>(
      (parent, part) => parent[part],
      obj
    ) as unknown as V
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
  targets(pathOrNode: Path | ArborNode<any>) {
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
  affects(node: ArborNode<any>): boolean {
    if (!isNode(node)) throw new NotAnArborNodeError()

    return this.toString().startsWith(node.$path.toString())
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
