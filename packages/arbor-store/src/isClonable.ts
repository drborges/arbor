export interface Clonable<T extends object> {
  $clone(): T
}

export default function isClonable<T extends object>(
  value: any
): value is Clonable<T> {
  const isNodeValue = value as Clonable<T>
  return typeof isNodeValue?.$clone === "function"
}
