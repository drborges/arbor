import isNode from "./isNode"

import type { AttributesOf } from "./Arbor"

export type Constructor<T extends object> = new (...args: any[]) => T

export function clonable(value: any): boolean {
  return (
    typeof value === "object" &&
    value?.constructor != null &&
    value.constructor.name !== "Date"
  )
}

export function clone<T extends object>(
  value: T,
  overrides: Partial<AttributesOf<T>> = {}
): T {
  const target = isNode(value) ? value.$unwrap() : value
  if (!clonable(target)) return value

  const Constructor = target?.constructor as Constructor<T>

  return Object.assign(new Constructor(), {
    ...target,
    ...overrides,
  })
}
