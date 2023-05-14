export const ArborProxiable = Symbol.for("ArborProxiable")

export default function isProxiable(value: unknown): boolean {
  if (value == null) return false

  return (
    Array.isArray(value) ||
    value[ArborProxiable] === true ||
    value.constructor === Object
  )
}
