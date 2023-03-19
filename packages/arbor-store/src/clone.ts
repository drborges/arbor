import isNode from "./isNode"
import isProxiable from "./isProxiable"
import isClonable from "./isClonable"

import { AttributesOf } from "./Arbor"
import { getUUID, setUUID } from "./uuid"

export type Constructor<T extends object> = new (...args: any[]) => T

function cloneFromConstructor<T extends object>(target: object, overrides: Partial<AttributesOf<T>>) {
  const Constructor = target?.constructor as Constructor<T>
  return Object.assign(new Constructor(), {
    ...target,
    ...overrides,
  })
}

export default function clone<T extends object>(
  value: T,
  overrides: Partial<AttributesOf<T>> = {}
): T {
  const target = isNode(value) ? value.$unwrap() : value
  const targetUUID = getUUID(target)

  if (!isProxiable(target)) return value

  const cloned = isClonable<T>(target)
    ? target.$clone()
    : cloneFromConstructor<T>(target, overrides)

  return setUUID(cloned, targetUUID)
}
