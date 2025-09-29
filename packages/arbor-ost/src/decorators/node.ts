export const ArborProxiable = Symbol.for("ArborProxiable")

/**
 * Make application classes eligible for being used as nodes in the Arbor state tree.
 *
 * @example
 *
 * ```ts
 * @node
 * class Todo {
 *   text: string
 * }
 * ```
 */
export function node<T extends Function>(target: T, _context: unknown = null) {
  target.prototype[ArborProxiable] = true
}
