import { Arbor } from "./arbor"
import { ArborProxiable } from "./decorators"
import type { Node } from "./types"

export function isNode<T extends object>(value: unknown): value is Node<T> {
  const isNodeValue = value as Node<T>
  return isNodeValue?.$tree instanceof Arbor
}

export function isProxiable(value: unknown): value is object {
  if (value == null) return false

  // TODO: Look into decoupling this logic from Array and Map classes.
  // If we can make this decision based on which node handlers are supported
  // e.g. ArrayHandler, MapHandler, SetHandler (coming soon):
  //
  // PoC:
  // supportedNodeHandlers.some(handler => handler.accept(value))
  //
  return (
    Array.isArray(value) ||
    value instanceof Map ||
    value[ArborProxiable] === true ||
    value.constructor === Object
  )
}
