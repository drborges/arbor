export interface Clonable<T extends object> {
  $clone(): T
}

export default function clonable<T extends object>(value: T): boolean {
  const clonableValue = value as Clonable<T>
  return typeof clonableValue?.$clone === "function"
}
