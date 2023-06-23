import Path from "./Path"
import type { Mutation, Node } from "./types"

/**
 * Mutates a given node by traversing the given path and applying the
 * given mutation to the target node.
 *
 * @param node the starting node to be traversed by the given path.
 * @param path the path to traverse starting from the given node.
 * @param mutation a mutation function to apply to the node at the path.
 * @returns the resulting node after the mutation is applied.
 */
export default function mutate<T extends object, K extends object>(
  node: Node<T>,
  path: Path,
  mutation: Mutation<K>
) {
  try {
    const root = node.$clone()

    const targetNode = path.walk<Node<K>>(root, (child: Node, parent: Node) => {
      const childCopy = child.$clone()

      parent.$children.set(childCopy.$unwrap(), childCopy)

      return childCopy
    })

    const metadata = mutation(targetNode.$unwrap())

    return {
      root,
      metadata,
    }
  } catch (e) {
    return undefined
  }
}
