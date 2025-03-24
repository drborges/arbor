import { OST } from "."
import { Path } from "./path"
import { Seed } from "./seed"
import { Subscriptions } from "./subscriptions"

export interface ProxyHandlerConstructor {
  new (ost: OST): ProxyHandler<Value>
  accepts(value: unknown): boolean
}

export type ArborNode<T extends object = object> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? ArborNode<T[K]>
    : T[K]
}

/**
 * Represents an observable object within the state that can be proxied and tracked by the OST
 */
export type Value = object

export type Node<V extends Value = Value> = {
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
  readonly previouslyUndefined?: boolean
  readonly props: (string | number | Symbol)[]
}

export type Mutation<T extends Value> = (target: T) => MutationMetadata

export type MutationResult<T extends object> = {
  root: Node<T>
  metadata: MutationMetadata
}

export type MutationEvent<T extends object> = {
  state: ArborNode<T>
  mutationPath: Path
  metadata: MutationMetadata
}

export type Subscriber<T extends object = object> = (
  event: MutationEvent<T>
) => void

export type Unsubscribe = () => void
