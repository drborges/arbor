export const ArborProxy = Symbol.for("ArborProxy")

export default function proxiable(value: any): boolean {
  return (
    value != null &&
    (Array.isArray(value) ||
      value[ArborProxy] === true ||
      value.constructor === Object ||
      typeof value.$clone === "function")
  )
}
