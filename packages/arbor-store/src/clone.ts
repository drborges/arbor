import isNode from "./isNode"
import proxiable, { Clonable } from "./proxiable"

import type { AttributesOf } from "./Arbor"

export type Constructor<T extends object> = new (...args: any[]) => T

function isClonable<T extends object>(value: any): value is Clonable<T> {
  const isNodeValue = value as Clonable<T>
  return typeof isNodeValue?.$clone === "function"
}

export default function clone<T extends object>(
  value: T,
  overrides: Partial<AttributesOf<T>> = {}
): T {
  const target = isNode(value) ? (value.$unwrap() as T) : value
  if (!proxiable(target)) return value

  if (isClonable<T>(target)) {
    return target.$clone()
  }

  const Constructor = target?.constructor as Constructor<T>

  return Object.assign(new Constructor(), {
    ...target,
    ...overrides,
  })
}
