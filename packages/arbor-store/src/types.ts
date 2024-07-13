import { Arbor } from "./arbor"
import { DefaultHandler } from "./handlers/default"
import { Path } from "./path"
import { Subscriptions } from "./subscriptions"

/**
 * Describes a Node Hnalder constructor capable of determining which
 * kinds of nodes it is able to handle.
 */
export interface Handler {
  /**
   * Creates a new instance of the node handling strategy.
   */
  new (
    tree: Arbor,
    value: unknown,
    subscriptions?: Subscriptions
  ): DefaultHandler

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
  readonly $tree: Arbor
  readonly $subscriptions: Subscriptions<T>

  $getChildNode<C extends object>(link: Link): Node<C>
  $setChildValue<C extends object>(link: Link, value: C): void
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

export type Clonnable<T extends object> = {
  $clone(): T
}
