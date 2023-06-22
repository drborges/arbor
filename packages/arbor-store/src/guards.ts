import Arbor, { ArborNode, Node } from "./Arbor"
import { ArborProxiable } from "./decorators"

export function isNode<T extends object>(value: unknown): value is Node<T> {
  const isNodeValue = value as Node<T>
  return isNodeValue?.$tree instanceof Arbor
}

export function isArborNode<T extends object>(
  value: unknown
): value is ArborNode<T> {
  return isNode(value)
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
