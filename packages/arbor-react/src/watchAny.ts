import { ArborNode, MutationEvent } from "@arborjs/store"

export function watchAny() {
  return <T extends object>(node: ArborNode<T>, event: MutationEvent) =>
    event.mutationPath.affects(node)
}
