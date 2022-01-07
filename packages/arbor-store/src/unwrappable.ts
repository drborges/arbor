export interface Unwrappable<T extends object> {
  $unwrap(): T
}

export default function unwrappable<T extends object>(
  value: any
): value is Unwrappable<T> {
  const unwrappableValue = value as Unwrappable<T>
  return typeof unwrappableValue?.$unwrap === "function"
}
