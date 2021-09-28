import { isClonable } from "./Clonable"

/**
 * Checks whether or not a given value can be proxied by Arbor.
 *
 * Currently Arbor only supports object literals and Arrays.
 *
 * @param value the value to check for.
 * @returns true if the given value can be proxied, false otherwise.
 */
export default function proxiable<T>(value: T): boolean {
  return (
    value != null &&
    (Array.isArray(value) ||
      isClonable(value as unknown as object) ||
      value.constructor === Object)
  )
}
