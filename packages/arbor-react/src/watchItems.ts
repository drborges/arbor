import { ArborNode, MutationEvent, isNode } from "@arborjs/store"
import { PropsOf } from "./watchNode"

export type Container<T extends object> = Array<T> | Map<unknown, T>

export function watchItems<T extends object>(...props: PropsOf<T>[]) {
  return (
    node: ArborNode<Container<T>>,
    event: MutationEvent<Container<T>>
  ) => {
    if (!isNode(node)) {
      return false
    }

    if (event.mutationPath.matches(node)) {
      return true
    }

    if (!event.mutationPath.parent.matches(node)) {
      return false
    }

    if (props.length === 0) {
      return true
    }

    return props.some((prop) => event.metadata.props.includes(prop))
  }
}
