import Arbor from "./Arbor"
import Children from "./Children"
import NodeHandler from "./NodeHandler"
import Path from "./Path"
import Subscribers from "./Subscribers"

/**
 * Describes a Node Hnalder constructor capable of determining which
 * kinds of nodes it is able to handle.
 */
export interface Handler {
  /**
   * Creates a new instance of the node handling strategy.
   */
  new (
    $tree: Arbor,
    $path: Path,
    $value: unknown,
    $children: Children,
    $subscribers: Subscribers
  ): NodeHandler

  /**
   * Checks if the strategy can handle the given value.
   *
   * @param value a potential node in the state tree.
   */
  accepts(value: unknown): boolean
}

/**
 * Recursively marks proxiable nodes in the state tree as being Arbor nodes.
 *
 * This type hints to developers which values are reactive, e.g. will cause
 * store updates when mutating.
 */
export type ArborNode<T extends object> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? ArborNode<T[K]>
    : T[K]
}

/**
 * Represents an Arbor state tree node with all of its internal API exposed.
 *
 * @internal
 *
 * This type is meant to be used internally for the most part and
 * may be removed from Arbor's public API.
 */
export type Node<T extends object = object, K extends object = T> = T & {
  /**
   * Clones the node intance.
   *
   * Used as part of the structural sharing algorithm for generating new
   * state trees upon mutations.
   */
  $clone(): Node<T>
  /**
   * Accesses a child node indexed by the given key.
   *
   * This allows Arbor to consistenly traverse any Node implementation that
   * may be used to compose the state tree.
   *
   * @param key the key used to index a chield node.
   * @returns the child Node indexed by the key. `undefined` is returned in case
   * the key does not belong to any child node.
   */
  $traverse(key: unknown): Node<T> | undefined
  /**
   * Reference to the state tree data structure.
   */
  readonly $tree: Arbor<K>
  /**
   * Returns the underlying value wrapped by the state tree node.
   */
  readonly $value: T
  /**
   * The path within the state tree where the Node resides in.
   */
  readonly $path: Path
  /**
   * Cache containing all children nodes of this node.
   */
  readonly $children: Children
  /**
   * Tracks subscribers of this Node.
   *
   * Subscribers are notified of any mutation event affecting this node.
   */
  readonly $subscribers: Subscribers<T>
}

/**
 * Describes an Arbor Plugin
 */
export interface Plugin<T extends object> {
  /**
   * Allows the plugin to configure itself with the given state tree instance.
   *
   * @param store an instance of a state tree
   * @returns a resolved promise that resolves when the plugin completes its
   * initialization. In case of an error, the promise is rejected.
   */
  configure(store: Arbor<T>): Promise<Unsubscribe>
}

export type MutationMetadata = {
  operation?: string
  props: string[]
}

/**
 * A mutation function used to update an Arbor tree node.
 */
export type Mutation<T extends object> = (arg0: T) => void | MutationMetadata

/**
 * Describes a function used by users to cancel their state updates subscription.
 */
export type Unsubscribe = () => void

/**
 * Describes a mutation event passed to subscribers
 */
export type MutationEvent<T extends object> = {
  state: ArborNode<T>
  mutationPath: Path
  metadata: MutationMetadata
}

/**
 * Subscriber function used to listen to mutation events triggered by the state tree.
 */
export type Subscriber<T extends object> = (event: MutationEvent<T>) => void
