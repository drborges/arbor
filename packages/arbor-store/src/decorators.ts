export const ArborDetached = Symbol.for("ArborDetached")
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

/**
 * Detaches an object's property from the state tree.
 *
 * Mutation to detached properties will not trigger store updates.
 *
 * @param target the object owning the property.
 * @param prop the property to detach from the state tree.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function detached(target: any, prop: any) {
  target[ArborDetached] = target[ArborDetached] || {}
  const detachedProps = target[ArborDetached]
  detachedProps[prop] = true
}

/**
 * Checks if a property belonging to a given object is detached from the state tree.
 *
 * @param target the object owning the property.
 * @param prop the property to check.
 * @returns true if the property is detached from the state tree.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDetachedProperty(target: any, prop: string) {
  return target?.[ArborDetached]?.[prop]
}
