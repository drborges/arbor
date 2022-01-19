import NodeCache from "./NodeCache"
import { Node } from "./Arbor"

export function unwrap<T extends object>(value: T): T {
  const node = value as Node<T>
  return node.$unwrap() as T
}

export function children<T extends object>(value: T): NodeCache {
  const node = value as Node<T>
  return node.$children
}

export function warmup<T extends object>(value: T): Node<T> {
  return value as Node<T>
}
