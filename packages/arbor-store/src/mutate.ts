import Path from "./Path"
import type { INode } from "./Arbor"

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

    const targetNode = path.props.reduce<INode<T>>((parent, prop) => {
      const childNode = parent[prop] as INode<T>
      const childNodeCopy = childNode.$clone()
      const childNodeValue = childNodeCopy.$unwrap()

      parent.$children.set(childNodeValue, childNodeCopy)

      return childNodeCopy
    }, root)

    const metadata = mutation(targetNode.$unwrap() as unknown as K)

    return {
      root,
      metadata,
    }
  } catch (e) {
    return undefined
  }
}
