import { ArborNode, MutationEvent } from "@arborjs/store"
import { NodeProps } from "./watchChildren"

export function watchNode<T extends object>(...props: NodeProps<T>[]) {
  return (node: ArborNode<T>, event: MutationEvent) => {
    if (!event.mutationPath.targets(node)) return false
    if (props.length === 0) return true

    return event.metadata.props.some((prop) =>
      props.includes(prop as NodeProps<T>)
    )
  }
}
