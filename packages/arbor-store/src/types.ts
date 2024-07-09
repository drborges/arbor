import { Arbor } from "./Arbor"
import { NodeHandler } from "./NodeHandler"
import { Path } from "./Path"
import { Seed } from "./Seed"
import { Subscribers } from "./Subscriptions"

export type Unwrappable<T extends object> = {
  $value: T
}

/**
 * Describes a Node Hnalder constructor capable of determining which
 * kinds of nodes it is able to handle.
 */
export interface Handler {
  /**
   * Creates a new instance of the node handling strategy.
   */
  new (tree: Arbor, value: unknown, subscribers?: Subscribers): NodeHandler

  /**
   * Checks if the strategy can handle the given value.
   *
   * @param value a potential node in the state tree.
   */
  accepts(value: unknown): boolean
}

export type ArborNode<T extends object = object> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? ArborNode<T[K]>
    : T[K]
}

export type Unsubscribe = () => void
export type MutationEvent<T extends object> = {
  state: ArborNode<T>
  mutationPath: Path
  metadata: MutationMetadata
}

export type Subscriber<T extends object = object> = (
  event: MutationEvent<T>
) => void

export type Link = string | number

export type Node<T extends object = object> = T & {
  readonly $value: T
  readonly $seed: Seed
  readonly $tree: Arbor
  readonly $subscriptions: Subscribers<T>

  $traverse<C extends object>(link: Link): C
  $attachValue<C extends object>(value: C, link: Link): void
}

export type Plugin<T extends object> = {
  configure(store: Store<T>): Promise<Unsubscribe>
}

export type Store<T extends object> = {
  readonly state: ArborNode<T>
  setState(value: T): ArborNode<T>
  subscribe(subscriber: Subscriber<T>): Unsubscribe
  subscribeTo<V extends object>(
    node: ArborNode<V>,
    subscriber: Subscriber<T>
  ): Unsubscribe
}

export type Visitor = (child: Node, parent: Node) => Node

export type MutationMetadata = {
  readonly operation: string
  readonly previouslyUndefined?: boolean
  readonly props: (string | number | Symbol)[]
}

export type Mutation<T extends object> = (
  target: T,
  node: Node<T>
) => MutationMetadata

export type MutationResult<T extends object> = {
  root: Node<T>
  metadata: MutationMetadata
}
