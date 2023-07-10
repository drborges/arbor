import { Arbor } from "Arbor"
import { Path } from "./Path"
import { Mutation, MutationEngine, MutationResult, Node } from "./types"

export class EagerMutationEngine<T extends object>
  implements MutationEngine<T>
{
  constructor(private readonly tree: Arbor<T>) {}

  clone<V extends object>(node: Node<V>): Node<V> {
    return this.tree.createNode<V>(
      node.$path,
      node.$value,
      node.$link,
      node.$subscribers
    )
  }

  mutate<V extends object>(
    path: Path,
    mutation: Mutation<V>
  ): MutationResult<T> {
    try {
      const root = this.clone(this.tree.root)

      const targetNode = path.walk<V>(root, (child: Node) => {
        const childCopy = this.clone(child)
        this.tree.nodes.set(childCopy.$seed, childCopy)
        return child
      })

      const metadata = mutation(targetNode.$value)

      return {
        root,
        metadata,
      }
    } catch (e) {
      return undefined
    }
  }
}
