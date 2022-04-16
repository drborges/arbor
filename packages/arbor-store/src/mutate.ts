import Path from "./Path"
import type { INode } from "./Arbor"

/**
 * A mutation function used to update an Arbor tree node.
 */
export type Mutation<T extends object> = (arg0: T) => void

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
): INode<T> {
  try {
    const root = node.$clone()

    const targetNode = path.props.reduce<INode<T>>((parent, prop) => {
      const childNode = parent[prop] as INode<T>
      const childNodeCopy = childNode.$clone()

      parent.$unwrap()[prop] = childNodeCopy.$unwrap()

      // Preemptively remove previous value from parent's children cache
      // to free up memory.
      parent.$children.delete(childNode.$unwrap())

      // Preemptively warms up the parent's children cache
      parent.$children.set(childNodeCopy.$unwrap(), childNodeCopy)

      return childNodeCopy
    }, root)

    mutation(targetNode.$unwrap() as unknown as K)

    return root
  } catch (e) {
    return undefined
  }
}
