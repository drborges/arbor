import { ArborNode, isNode, MutationEvent } from "@arborjs/store";

export function watchNode() {
  return <T extends object>(node: ArborNode<T>) =>
    (event: MutationEvent<T>) => {
      if (!isNode(node)) return false

      return event.mutationPath.is(node.$path)
    }
}
