export const ArborDetached = Symbol.for("ArborDetached")

export function detached(target: any, prop: any) {
  target[ArborDetached] = target[ArborDetached] || {}
  const detachedProps = target[ArborDetached]
  detachedProps[prop] = true
}
