import Path from "./Path"
import isNode from "./isNode"
import NodeCache from "./NodeCache"
import NodeHandler from "./NodeHandler"
import Subscribers, { Subscriber, Unsubscribe } from "./Subscribers"
import mutate, { Mutation } from "./mutate"
import NodeArrayHandler from "./NodeArrayHandler"

/**
 * Recursively describes the props of an Arbor state tree node.
 */
export type ArborNode<T extends object> = {
  [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : ArborNode<T[P]>
    : T[P]
}

/**
 * Represents an Arbor state tree node with all of its internal API exposed.
 */
export type INode<T extends object = object> = T & {
  $unwrap(): T
  $clone(): INode<T>
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
export default class Arbor<T extends object> {
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
  #root: INode<T>

  /**
   * Holds all state change subscriptions.
   */
  #subscribers = new Subscribers<T>()

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
   * Mutating a node referenced by a path:
   *
   * ```ts
   * const store = new Arbor({ users: [] })
   * store.mutate(Path.parse("/users"), node => node.push({ name: "John Doe" }))
   * store.root
   * => { users: [{ name: "John Doe" }]}
   * ```
   *
   * Or using a node reference:
   *
   * ```ts
   * const store = new Arbor({ users: [] })
   * store.mutate(store.root.users, node => node.push({ name: "John Doe" }))
   * store.root
   * => { users: [{ name: "John Doe" }]}
   * ```
   *
   * @param pathOrNode the path or the node within the state tree to be mutated.
   * @param mutation a function responsible for mutating the target node at the given path.
   */
  mutate<V extends object>(pathOrNode: Path | INode<V>, mutation: Mutation<V>) {
    const path = isNode(pathOrNode) ? pathOrNode.$path : pathOrNode
    const current = mutate(this.#root, path, mutation)
    const previous = this.#root.$unwrap()
    const node = isNode(pathOrNode)
      ? pathOrNode
      : (path.walk(this.#root) as INode<V>)

    if (current) {
      if (this.mode === MutationMode.FORGIVEN) {
        mutation(node.$unwrap())
      }

      this.#root = current
      this.#subscribers.notify({
        state: { current, previous },
        mutationPath: path,
      })
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
  ): INode<V> {
    const handler = Array.isArray(value)
      ? new NodeArrayHandler(this, path, value as V[], children)
      : new NodeHandler(this, path, value, children)

    return new Proxy<V>(value, handler as ProxyHandler<V>) as INode<V>
  }

  /**
   * Retrieves a node from the state tree by its path.
   *
   * @param path the path of the node to be retrieved.
   * @returns the node at the given path.
   */
  getNodeAt<V extends object>(path: Path): INode<V> {
    return path.walk(this.#root)
  }

  /**
   * Sets a given value as the root node of the state tree.
   *
   * @param value the value to be used as the root of the state tree.
   * @returns the root node.
   */
  setRoot(value: T): INode<T> {
    const current = this.createNode(Path.root, value)
    const previous = this.#root?.$unwrap()
    this.#root = current
    this.#subscribers.notify({
      state: { current, previous },
      mutationPath: Path.root,
    })

    return current
  }

  /**
   * Subscribes to state tree updates.
   *
   * @param subscriber a function to be called whenever a state update occurs.
   * @returns an unsubscribe function that can be used to cancel the subscriber.
   */
  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    return this.#subscribers.subscribe(subscriber)
  }

  /**
   * Register plugins to extend the store capabilities.
   *
   * @param plugin plugin to extend the store with.
   * @returns a promise that gets resolved when the plugin completes its configuration steps.
   */
  async use(plugin: Plugin<T>) {
    return plugin.configure(this)
  }

  /**
   * Returns the current state tree root node.
   */
  get root(): ArborNode<T> {
    return this.#root
  }
}
