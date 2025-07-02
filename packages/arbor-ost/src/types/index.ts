import { OST } from "../ost"
import { Path } from "../path"
import { Seed } from "../seed"
import { Subscriptions } from "../subscriptions"

export type Prop = string | symbol

export interface ProxyHandlerConstructor {
  new (ost: OST): ProxyHandler<Value>
  accepts(value: unknown): boolean
}

export type $<T extends object = object> = Node<T> & {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends Array<infer I extends object>
    ? $<I[]>
    : T[K] extends object
    ? $<T[K]>
    : T[K]
}

/**
 * Represents an observable object within the state that can be proxied and tracked by the OST
 */
export type Value = object

export type Node<V extends Value = Value> = V & {
  readonly $ost: OST
  readonly $value: V
  readonly $path: Path
  readonly $seed: Seed
  readonly $parent?: Node
  readonly $subscriptions: Subscriptions<V>
  $children(): Iterable<Node>
  $createChild<C extends Value>(value: C): Node<C>
}

export type MutationMetadata = {
  readonly operation: string
  readonly args: unknown[]
}

export type Mutation<T extends Value> = (node?: Node<T>) => MutationMetadata

export type MutationEvent<V extends Value> = {
  target: Node<V>
  metadata: MutationMetadata
}

export type Subscriber<T extends object = object> = (
  event: MutationEvent<T>
) => void

export type Unsubscribe = () => void
