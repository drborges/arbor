export const ArborProxiable = Symbol.for("ArborProxiable")

export default function proxiable(value: any): boolean {
  return (
    value != null &&
    (Array.isArray(value) ||
      value[ArborProxiable] === true ||
      value.constructor === Object ||
      typeof value.$clone === "function")
  )
}
