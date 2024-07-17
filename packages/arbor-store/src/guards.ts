import { Arbor } from "./arbor"
import { ArborProxiable } from "./decorators"
import type { Node } from "./types"

export function isNode<T extends object>(value: unknown): value is Node<T> {
  const isNodeValue = value as Node<T>
  return isNodeValue?.$tree instanceof Arbor
}

export function isProxiable(value: unknown): value is object {
  if (value == null) return false

  return (
    Array.isArray(value) ||
    value instanceof Map ||
    value[ArborProxiable] === true ||
    value.constructor === Object
  )
}
