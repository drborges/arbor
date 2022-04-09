import { Node } from "./Arbor"
import Path from "./Path"

export default function isNode<T extends object>(value: any): value is Node<T> {
  const node = value as Node<T>
  return typeof node?.$unwrap === "function" && node?.$path instanceof Path
}
