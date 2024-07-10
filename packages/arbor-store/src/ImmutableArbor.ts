import { Arbor } from "./Arbor"
import { hasCustomClonningLogic } from "./guards"
import { MutationEngine } from "./MutationEngine"
import { Seed } from "./path"
import { Node } from "./types"

/**
 * @experimental it appears we don't necessarily have to go full immutable to leverage React 18
 * concurrent mode so we'll likely end up removing the 'snapshot' mutation mode idea.
 */

function clone<T extends object>(value: T): T {
  const clonedValue = hasCustomClonningLogic<T>(value)
    ? value.$clone()
    : cloneViaConstructor(value)

  const seed = Seed.from(value)
  Seed.plant(clonedValue, seed)
  return clonedValue
}

function cloneViaConstructor<T extends object>(value: T): T {
  const constructor = value.constructor as new () => T
  const instance = new constructor()
  return Object.assign(instance, value)
}

export class ImmutableArbor<T extends object> extends Arbor<T> {
  protected readonly engine = new MutationEngine<T>(this, "snapshot")

  cloneNode<V extends object>(node: Node<V>): Node<V> {
    return this.createNode<V>(
      this.getPathFor(node),
      clone(node.$value),
      this.getLinkFor(node),
      node.$subscriptions
    )
  }
}
