import { ArborNode, INode } from "./Arbor"
import NodeCache from "./NodeCache"
import isNode from "./isNode"

export function unwrap<T extends object>(value?: T): T {
  const node = value as INode<T>
  return node?.$unwrap()
}

export function children<T extends object>(value: T): NodeCache {
  const node = value as INode<T>
  return node.$children
}

export function warmup<T extends object>(value: T): INode<T> {
  return value as INode<T>
}

export function toINode<
  T extends ArborNode<object>,
  K extends object = T extends ArborNode<infer D> ? D : never
>(value: T): INode<K> {
  if (isNode(value)) return value as unknown as INode<K>

  throw new Error("The value provided is not an Arbor node")
}

export function snapshot<T extends object>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T
}
