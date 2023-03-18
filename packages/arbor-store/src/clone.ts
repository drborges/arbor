import isNode from "./isNode"
import isProxiable from "./isProxiable"
import isClonable from "./isClonable"

import { AttributesOf } from "./Arbor"
import { ArborUUID, assignUUID } from "./uuid"

export type Constructor<T extends object> = new (...args: any[]) => T

export default function clone<T extends object>(
  value: T,
  overrides: Partial<AttributesOf<T>> = {}
): T {
  const target = isNode(value) ? value.$unwrap() : value

  if (!isProxiable(target)) return value

  if (isClonable<T>(target)) {
    const c = target.$clone()
    assignUUID(c, target[ArborUUID])
    return c
  }

  const Constructor = target?.constructor as Constructor<T>

  const c = Object.assign(new Constructor(), {
    ...target,
    ...overrides,
  })
  assignUUID(c, target[ArborUUID])
  return c
}
