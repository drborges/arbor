import { ArborNode, MutationEvent } from "@arborjs/store"

export function watchNode() {
  return <T extends object>(node: ArborNode<T>, event: MutationEvent<T>) =>
    event.mutationPath.targets(node)
}
