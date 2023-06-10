import { ArborNode, MutationEvent } from "@arborjs/store"
import { watchItems } from "./watchItems"
import { PropsOf } from "./watchNode"

export function watchMapItems<T extends object>(...props: PropsOf<T>[]) {
  return (
    node: ArborNode<Map<unknown, T>>,
    event: MutationEvent<Map<unknown, T>>
  ) => {
    return watchItems(...props)(node, event)
  }
}
