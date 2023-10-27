import { ArborNode, MutationEvent } from "@arborjs/store"

export function watchAny() {
  return <T extends object>(event: MutationEvent<T>, node: ArborNode<T>) => {
    return event.mutationPath.affects(node)
  }
}
