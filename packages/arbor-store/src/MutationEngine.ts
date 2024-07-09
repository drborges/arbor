import { Arbor } from "./Arbor"
import { Path } from "./Path"
import { Mutation, MutationResult } from "./types"

export type MutationMode = "eager" | "snapshot"

export class MutationEngine<T extends object> {
  constructor(
    private readonly tree: Arbor<T>,
    private readonly mode: MutationMode = "eager"
  ) {}

  mutate<V extends object>(
    path: Path,
    mutation: Mutation<V>
  ): MutationResult<T> {
    try {
      const root = this.tree.cloneNode(this.tree.root)

      const targetNode = path.walk<V>(root, (child, parent) => {
        const childCopy = this.tree.cloneNode(child)
        const link = this.tree.getLinkFor(childCopy)

        // TODO: remove mode, it seems we don't necessarily need to employ
        // immutability at the data level to get Arbor to work with React's
        // concurrent mode, as long as we apply structural sharing on the
        // proxy tree and use `useSyncExternalStore` we should be good.
        if (this.mode === "snapshot") {
          parent.$setChildValue(childCopy.$value, link)
        }

        return childCopy
      })

      const metadata = mutation(targetNode.$value, targetNode)

      return {
        root,
        metadata,
      }
    } catch (e) {
      return undefined
    }
  }
}
