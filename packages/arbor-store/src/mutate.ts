import type { INode } from "./Arbor"
import Path from "./Path"

export type MutationMetadata = {
  operation?: string
  props: string[]
}

/**
 * A mutation function used to update an Arbor tree node.
 */
export type Mutation<T extends object> = (arg0: T) => void | MutationMetadata

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
  node: INode<T>,
  path: Path,
  mutation: Mutation<K>
) {
  try {
    const root = node.$clone()

    const targetNode = path.walk(root, (child: INode, parent: INode) => {
      const childCopy = child.$clone()
      const childValue = childCopy.$unwrap()

      parent.$children.set(childValue, childCopy)

      return childCopy
    }) as INode

    const metadata = mutation(targetNode.$unwrap() as unknown as K)

    return {
      root,
      metadata,
    }
  } catch (e) {
    return undefined
  }
}
