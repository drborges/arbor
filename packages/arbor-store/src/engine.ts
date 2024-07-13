import { Arbor } from "./arbor"
import { hasCustomClonningLogic } from "./guards"
import { Path, Seed } from "./path"
import { Mutation, MutationResult, Node } from "./types"

export type MutationMode = "eager" | "snapshot"

function clone<T extends object>(value: T): T {
  const clonedValue = hasCustomClonningLogic<T>(value)
    ? value.$clone()
    : cloneViaConstructor(value)

  Seed.plant(clonedValue, Seed.from(value))
  return clonedValue
}

function cloneViaConstructor<T extends object>(value: T): T {
  const constructor = value.constructor as new () => T
  const instance = new constructor()
  return Object.assign(instance, value)
}

export class MutationEngine<T extends object> {
  constructor(
    private readonly tree: Arbor<T>,
    private readonly mode: MutationMode = "eager"
  ) {}

  mutate<V extends object>(
    path: Path,
    rootNode: Node<T>,
    mutation: Mutation<V>
  ): MutationResult<T> {
    try {
      const root = this.cloneNode(rootNode)

      const targetNode = path.walk<V>(root, (child, parent) => {
        const childCopy = this.cloneNode(child)

        if (this.mode === "snapshot") {
          const link = this.tree.getLinkFor(childCopy)
          parent.$setChildValue(link, childCopy.$value)
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

  cloneNode<V extends object>(node: Node<V>): Node<V> {
    return this.tree.createNode<V>(
      this.tree.getPathFor(node),
      this.mode === "snapshot" ? clone(node.$value) : node.$value,
      this.tree.getLinkFor(node),
      node.$subscriptions
    )
  }
}
