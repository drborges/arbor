import { ArborNode, MutationEvent } from "@arborjs/store"
import { watchItems } from "./watchItems"
import { PropsOf } from "./watchNode"

export function watchArrayItems<T extends object>(...props: PropsOf<T>[]) {
  return (node: ArborNode<Array<T>>, event: MutationEvent<Array<T>>) => {
    return watchItems(...props)(node, event)
  }
}
