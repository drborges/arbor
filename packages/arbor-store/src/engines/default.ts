import { Arbor } from "../arbor"
import { Path } from "../path"
import { Mutation, MutationResult, Node } from "../types"

export class DefaultEngine<T extends object> {
  constructor(protected readonly tree: Arbor<T>) {}

  mutate<V extends object>(
    path: Path,
    mutation: Mutation<V>
  ): MutationResult<T> {
    try {
      const nodes = this.tree.walk<V>(path, this.cloneNode.bind(this))
      const root = nodes[0] as unknown as Node<T>
      const target = nodes.at(-1)
      // TODO: maybe let's just pass targetNode to a mutation function and let it do it's thing?
      const metadata = mutation(target.$value, target)

      return {
        root,
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
