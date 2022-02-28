import Path from "./Path"
import isNode from "./isNode"
import NodeCache from "./NodeCache"
import NodeHandler from "./NodeHandler"
import mutate, { Mutation } from "./mutate"
import NodeArrayHandler from "./NodeArrayHandler"

/**
 * Represents an Arbor tree node.
 */
export type Node<T extends object = object> = T & {
  $unwrap(): T
  $clone(): Node<T>
  get $tree(): Arbor<T>
  get $path(): Path
  get $children(): NodeCache
}

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
  STRICT,
  FORGIVEN,
}

export type ArborConfig = {
  mode?: MutationMode
}

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
  configure(store: Arbor<T>): Promise<void>
}

export type AttributesOf<T extends object> = { [P in keyof T]: T[P] }

/**
 * Implements the Arbor state tree abstraction
 *
 * This class provides a Proxy-based API for managing
 * the state tree data structure, allowing for a simple
 * JS based API to trigger mutations that result in new
 * state values through structural sharing.
 *
 * @example
 *
 * ```ts
 * const store = new Arbor({ users: [] })
 * ```
 *
 */
export default class Arbor<T extends object = {}> {
  /**
   * Controls whether or not Arbor should propagate mutation side-effects
   * to the original node underlying value.
   *
   * @see {@link MutationMode}
   */
  readonly mode: MutationMode

  /**
   * Tracks the current state tree root node.
   */
  #root: Node<T>

  /**
   * Holds all state change subscriptions.
   */
  #subscriptions: Set<Subscription<T>> = new Set()

  /**
   * Create a new Arbor instance.
   *
   * @param initialState the initial state tree value
   */
  constructor(
    initialState = {} as T,
    { mode = MutationMode.STRICT }: ArborConfig = {}
  ) {
    this.mode = mode
    this.setRoot(initialState)
  }

  /**
   * Triggers a mutation against a node within a given path
   * in the state tree by applying structural sharing between
   * the previous and the newly computed state.
   *
   * @example
   *
   * ```ts
   * const store = new Arbor({ users: [] })
   * store.mutate(Path.parse("/users"), node => node.push({ name: "John Doe" }))
   * store.root
   * => { users: [{ name: "John Doe" }]}
   * ```
   *
   * @param path the path within the state tree affected by the mutation.
   * @param mutation a function responsible for mutating the target node at the given path.
   */
  mutate<V extends object>(pathOrNode: Path | Node<V>, mutation: Mutation<V>) {
    const path = isNode(pathOrNode) ? pathOrNode.$path : pathOrNode
    const node = isNode(pathOrNode) ? pathOrNode : path.walk(this.root) as Node<V>
    const oldRootValue = this.root.$unwrap()
    const newRoot = mutate(this.root, path, mutation)

    if (newRoot) {
      if (this.mode === MutationMode.FORGIVEN) {
        mutation(node.$unwrap())
      }

      this.#root = newRoot

      this.notify(newRoot, oldRootValue)
    } else if (global.DEBUG) {
      // eslint-disable-next-line no-console
      console.warn(
        `Could not mutate path ${path}. The path no longer exists within the state tree.`
      )
    }
  }

  /**
   * Adds a given value as a node at the given path within the state tree.
   *
   * Nodes are proxies that can trigger state tree mutations via regular JS
   * operations, such as assignements, object key deletions, Array API, etc.
   *
   * @param path the path within the state tree where the node should be added.
   * @param value the node's value.
   * @returns the node added to the state tree.
   */
  createNode<V extends object>(
    path: Path,
    value: V,
    children = new NodeCache()
  ): Node<V> {
    const handler = Array.isArray(value)
      ? new NodeArrayHandler(this, path, value, children)
      : new NodeHandler(this, path, value, children)

    return new Proxy<V>(value, handler as ProxyHandler<V>) as Node<V>
  }

  /**
   * Retrieves a node from the state tree by its path.
   *
   * @param path the path of the node to be retrieved.
   * @returns the node at the given path.
   */
  getNodeAt<V extends object>(path: Path): Node<V> {
    return path.walk(this.#root)
  }

  /**
   * Sets a given value as the root node of the state tree.
   *
   * @param value the value to be used as the root of the state tree.
   * @returns the root node.
   */
  setRoot(value: T): Node<T> {
    const oldRoot = this.root?.$unwrap()
    const node = this.createNode(Path.root, value)
    this.#root = node as Node<T>
    this.notify(node, oldRoot)
    return node
  }

  /**
   * Subscribes to state tree updates.
   *
   * @param subscription a function to be called whenever a state update occurs.
   * @returns an unsubscribe function that can be used to cancel the subscription.
   */
  subscribe(subscription: Subscription<T>): Unsubscribe {
    this.#subscriptions.add(subscription)

    return () => {
      this.#subscriptions.delete(subscription)
    }
  }

  /**
   * Notifies subscribers about state updates.
   *
   * @param newState the new state tree root node.
   * @param oldState the value of the previous state tree root node.
   */
  notify(newState: Node<T>, oldState: T) {
    this.#subscriptions.forEach((subscription) => {
      subscription(newState, oldState)
    })
  }

  async use(plugin: Plugin<T>) {
    return plugin.configure(this)
  }

  /**
   * Returns the current state tree root node.
   */
  get root(): Node<T> {
    return this.#root
  }
}
