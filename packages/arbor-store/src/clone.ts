import isNode from "./isNode"
import proxiable from "./proxiable"
import isClonable from "./isClonable"

import type { AttributesOf } from "./Arbor"

export type Constructor<T extends object> = new (...args: any[]) => T

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
