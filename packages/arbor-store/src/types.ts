import Path from "./Path"

/**
 * Controls Arbor's mutation behavior.
 *
 * 1. `forgiven`: Tells Arbor to propagate mutation side-effects to the original
 * node underlying value, keeping the previous and next nodes state in sync, although
 * nodes will still rely on structural sharing in order to determine diffs between state
 * tree snapshops. This allows for multiple subsequent mutations to be triggered off of
 * the same node reference.
 *
 * @example
 *
 * ```ts
 * const state = { count: 0 }
 * const tree = new Arbor(state, { mode: MutationMode.FORGIVEN })
 * const root = tree.root
 * root.count++
 * => 1
 * root.count++
 * => 2
 * ```
 *
 * 2. `strict`: Prevents mutation side-effects from being propagated to the original
 * node underlying value. Subsequent mutations triggered off of the same node reference
 * will yield the same result.
 *
 * @example
 *
 * ```ts
 * cosnt state = { count: 0 }
 * const tree = new Arbor(state, { mode: MutationMode.STRICT })
 * const root = tree.root
 * root.count++
 * => 1
 * root.count++
 * => 1
 * ```
 */
export enum MutationMode {
  FORGIVEN,
  STRICT,
}

export type ArborConfig = {
  mode?: MutationMode
}

export interface ICacheable {
  delete(value: object): boolean
  has(value: object): boolean
  get<V extends object>(value: object): Node<V>
  set<V extends object>(value: object, node: Node<V>): Node<V>
  reset(): void
}

/**
 * Describes the IStateTree API of Arbor stores.
 */
export interface IStateTree<T extends object = object> {
  mutate<V extends object>(path: Path, mutation: Mutation<V>): void
  subscribe(subscription: Subscription<T>): Unsubscribe
  notify(newState: Node<T>, oldState: T): void
  createNode<V extends object>(
    path: Path,
    value: V,
    children?: ICacheable
  ): Node<V>
  getNodeAt<V extends object>(path: Path): Node<V>
  setRoot(root: T): Node<T>
  get root(): Node<T>
}

/**
 * Describes the basic API of an Arbor tree node.
 */
export interface INode<T extends object> {
  $unwrap(): T
  $clone(): Node<T>
  $flush(): void
  get $path(): Path
  get $children(): ICacheable
}

/**
 * Describes the basic API of an Arbor tree array node.
 */
export interface IArrayNode<T extends object> extends INode<T> {
  reverse(): Node<T[]>
  pop(): T
  push(item: T): number
  shift(): T
  sort(compareFn: (a: T, b: T) => number): T[]
  splice(start: number, deleteCount: number, ...items: T[]): T[]
  unshift(...items: T[]): number
}

/**
 * Represents an Arbor tree node.
 */
export type Node<T extends object = object> = T & INode<T>

/**
 * A mutation function used to update an Arbor tree node.
 */
export type Mutation<T extends object> = (arg0: T) => void

/**
 * Describes a function used by users to cancel their state updates subscription.
 */
export type Unsubscribe = () => void

/**
 * Subscription function used to notify subscribers about state updates.
 */
export type Subscription<T extends object> = (
  newState: Node<T>,
  oldState: T
) => void

/**
 * Describes an Arbor Plugin
 */
export interface Plugin<T extends object> {
  /**
   * Allows the plugin to configure itself with the given state tree instance.
   *
   * @param store an instance of a state tree
   * @returns a resolved promise if the configuration was successful, or a rejected one otherwise.
   */
  configure(store: IStateTree<T>): Promise<void>
}
