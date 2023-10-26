import { Arbor } from "./Arbor"
import { NodeHandler } from "./NodeHandler"
import { Path } from "./Path"
import { Seed } from "./Seed"
import { Subscribers } from "./Subscribers"

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
  new (
    tree: Arbor,
    path: Path,
    value: unknown,
    subscribers?: Subscribers
  ): NodeHandler

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
  readonly $path: Path
  readonly $link: Link
  readonly $tree: Arbor
  readonly $lastRevision: Node<T>
  readonly $subscribers: Subscribers<T>

  /**
   * Checks if this node and the given node are the same even if different
   * "revisions" of the same node.
   *
   * Nodes are considered the same if they hold the same `seed` value assigned
   * to them during their creation.
   *
   * @param node node to compare to
   */
  $is(node: Node): boolean
  $traverse<C extends object>(link: Link): C
  $attach<C extends object>(link: Link, value: C): void
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
  readonly props: (string | number | Symbol)[]
}

export type Mutation<T extends object> = (target: T) => MutationMetadata

export type MutationResult<T extends object> = {
  root: Node<T>
  metadata: MutationMetadata
}
