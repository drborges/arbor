import { ArborNode, INode } from "./Arbor"

export function isNode<T extends object>(value: unknown): value is INode<T> {
  const isNodeValue = value as INode<T>
  return typeof isNodeValue?.$unwrap === "function"
}

export function isArborNode<T extends object>(
  value: unknown
): value is ArborNode<T> {
  return isNode(value)
}
