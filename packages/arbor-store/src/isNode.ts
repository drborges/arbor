import { Node } from "./types"

export default function isNode<T extends object>(value: any): value is Node<T> {
  const isNodeValue = value as Node<T>
  return typeof isNodeValue?.$unwrap === "function"
}
