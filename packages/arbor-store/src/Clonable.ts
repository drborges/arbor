export interface Clonable<T extends object> {
  $clone(): T
}
export function isClonable<T extends object>(value: T): boolean {
  const clonable = value as Clonable<T>
  return typeof clonable?.$clone === "function"
}
