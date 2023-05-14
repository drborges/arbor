import { INode } from "./Arbor"

export default function isNode<T extends object>(
  value: unknown
): value is INode<T> {
  const isNodeValue = value as INode<T>
  return typeof isNodeValue?.$unwrap === "function"
}
