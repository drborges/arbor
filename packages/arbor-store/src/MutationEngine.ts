import { Arbor } from "./Arbor"
import { Path } from "./Path"
import { Seed } from "./Seed"
import { Mutation, MutationResult, Node } from "./types"

type Clonnable<T extends object> = {
  $clone(): T
}

function hasCustomClonningLogic<T extends object>(
  value: object
): value is Clonnable<T> {
  return "$clone" in value && typeof value.$clone === "function"
}

function cloneViaConstructor<T extends object>(value: T): T {
  const constructor = value.constructor as new () => T
  const instance = new constructor()
  return Object.assign(instance, value)
}

/**
 * Shallow clone the given value by following a few rules:
 *
 * 1. when value defines a $clone function method, that is used to determine
 * the clonned value;
 * 2. otherwise, the clonned value happens by:
 *    1. creating a new instance via the value's constructor;
 *    2. assign all the properties from the original value to the new instance.
 */
function clone<T extends object>(value: T): T {
  const clonedValue = hasCustomClonningLogic<T>(value)
    ? value.$clone()
    : cloneViaConstructor(value)

  const seed = Seed.from(value)
  Seed.plant(clonedValue, seed)
  return clonedValue
}

export type MutationMode = "eager" | "snapshot"

export class MutationEngine<T extends object> {
  constructor(
    private readonly tree: Arbor<T>,
    private readonly mode: MutationMode = "eager"
  ) {}

  clone<V extends object>(node: Node<V>): Node<V> {
    return this.tree.createNode<V>(
      this.tree.getPathFor(node),
      this.mode === "snapshot" ? clone(node.$value) : node.$value,
      this.tree.getLinkFor(node),
      node.$subscriptions
    )
  }

  mutate<V extends object>(
    path: Path,
    mutation: Mutation<V>
  ): MutationResult<T> {
    try {
      const root = this.clone(this.tree.root)

      const targetNode = path.walk<V>(root, (child, parent) => {
        const childCopy = this.clone(child)
        const link = this.tree.getLinkFor(childCopy)

        // TODO: remove mode, it seems we don't necessarily need to employ
        // immutability at the data level to get Arbor to work with React's
        // concurrent mode, as long as we apply structural sharing on the
        // proxy tree and use `useSyncExternalStore` we should be good.
        if (this.mode === "snapshot") {
          parent.$attachValue(childCopy.$value, link)
        }

        this.tree.attachNode(childCopy, link)
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
