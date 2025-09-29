export const ArborDetached = Symbol.for("ArborDetached")

export function detached(target: unknown, prop: unknown) {
  target[ArborDetached] = target[ArborDetached] || {}
  const detachedProps = target[ArborDetached]
  detachedProps[prop] = true
}
