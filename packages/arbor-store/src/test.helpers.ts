import NodeCache from "./NodeCache"
import { INode } from "./Arbor"

export function unwrap<T extends object>(value: T): T {
  const node = value as INode<T>
  return node.$unwrap() as T
}

export function children<T extends object>(value: T): NodeCache {
  const node = value as INode<T>
  return node.$children
}

export function warmup<T extends object>(value: T): INode<T> {
  return value as INode<T>
}
