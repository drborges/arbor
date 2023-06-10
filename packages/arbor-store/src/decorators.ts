export const ArborProxiable = Symbol.for("ArborProxiable")

/**
 * Decorates a class marking it as Arbor proxiable, allowing
 * Arbor to use it as Node type.
 *
 * @example
 *
 * ```ts
 * @proxiable
 * class Todo {
 *   text: string
 * }
 * ```
 */
export function proxiable<T extends Function>(
  target: T,
  _context: unknown = null
) {
  target.prototype[ArborProxiable] = true
}
