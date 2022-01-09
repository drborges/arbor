import Path from "./Path"
import mutate from "./mutate"
import {
  ArborConfig,
  IStateTree,
  Mutation,
  MutationMode,
  Node,
  Plugin,
  Subscription,
  Unsubscribe,
} from "./types"
import NodeCache from "./NodeCache"
import NodeHandler from "./NodeHandler"
import NodeArrayHandler from "./NodeArrayHandler"

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
export default class Arbor<T extends object = {}> implements IStateTree {
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
  mutate<V extends object>(path: Path, mutation: Mutation<V>) {
    try {
      const oldRootValue = this.root.$unwrap()
      const newRoot = mutate(this.root, path, mutation)

      if (this.mode === MutationMode.FORGIVEN) {
        mutation(path.walk(oldRootValue) as V)
      }

      this.#root = newRoot

      this.notify(newRoot, oldRootValue)
    } catch (e) {
      if (e.message.includes("Cannot read property '$clone' of undefined")) {
        console.warn(
          `Cannot mutate path ${path}. It no longer exists within the state tree`
        )
      } else {
        throw e
      }
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
