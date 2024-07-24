import { Arbor } from "../arbor"
import { Path } from "../path"
import { Mutation, MutationResult, Node } from "../types"

export class DefaultEngine<T extends object> {
  constructor(protected readonly tree: Arbor<T>) {}

  mutate<V extends object>(
    path: Path,
    rootNode: Node<T>,
    mutation: Mutation<V>
  ): MutationResult<T> {
    try {
      const targetNode = path.walk<V>(rootNode, this.cloneNode.bind(this))
      const metadata = mutation(targetNode.$value, targetNode)

      return {
        root: this.tree.getNodeFor(rootNode),
        metadata,
      }
    } catch (e) {
      return undefined
    }
  }

  cloneNode<V extends object>(node: Node<V>): Node<V> {
    const path = this.tree.getPathFor(node)
    const link = this.tree.getLinkFor(node)

    return this.tree.createNode<V>(path, node.$value, link, node.$subscriptions)
  }
}
