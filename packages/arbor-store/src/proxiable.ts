export const ArborProxy = Symbol.for("ArborProxy")
export interface Clonable<T extends object> {
  $clone(): T
}

export default function proxiable(value: any): boolean {
  return (
    value != null &&
    (Array.isArray(value) ||
      value[ArborProxy] === true ||
      value.constructor === Object ||
      typeof value.$clone === "function")
  )
}
