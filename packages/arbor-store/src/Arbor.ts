// eslint-disable-next-line max-classes-per-file
import NodeArrayHandler from "./NodeArrayHandler"
import NodeCache from "./NodeCache"
import NodeHandler from "./NodeHandler"
import NodeMapHandler from "./NodeMapHandler"
import Path from "./Path"
import Subscribers, { Subscriber, Unsubscribe } from "./Subscribers"
import { NotAnArborNodeError, StaleNodeError } from "./errors"
import isNode from "./isNode"
import { ArborProxiable } from "./isProxiable"
import mutate, { Mutation, MutationMetadata } from "./mutate"
import { notifyAffectedSubscribers } from "./notifyAffectedSubscribers"
import { getUUID, setUUID } from "./uuid"

/**
 * Decorates a class marking it as Arbor proxiable, allowing
 * Arbor to use it as Node type.
 *
 * @returns Arbor compatiby type.
 */
export function Proxiable() {
  return <T extends Function>(target: T, _context: unknown) => {
    target.prototype[ArborProxiable] = true
  }
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
    $tree: Arbor,
    $path: Path,
    $value: unknown,
    $children: NodeCache,
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
export type INode<T extends object = object, K extends object = T> = T & {
  $unwrap(): T
  $clone(): INode<T>
  readonly $tree: Arbor<K>
  readonly $path: Path
  readonly $children: NodeCache
  readonly $subscribers: Subscribers
}

export type ArborConfig = {
  handlers?: Handler[]
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

/*
 * Default list of state tree node Proxy handlers.
 *
 * A node Proxy handler is the mechanism in which Arbor uses to proxy access to data
 * within the state tree as well as hook into write operations so that subscribers can
 * be notified accordingly and the next state tree generated via structural sharing.
 */
const defaultNodeHandlers = [NodeArrayHandler, NodeMapHandler, NodeHandler]

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
export default class Arbor<T extends object = object> {
  /**
   * List of proxy handlers used to determine at Runtime which handling strategy to use
   * for proxying a given node within the state tree.
   *
   * By default Arbor will use the NodeArrayHandler implementation to handle array values
   * and NodeHandler for all other proxiable values.
   *
   * Users can extend this list with new strategies allowing them to customize the proxying
   * behavior of Arbor.
   */
  #handlers: Handler[]

  /**
   * Reference to the root node of the state tree
   */
  #root: INode<T>

  /**
   * Create a new Arbor instance.
   *
   * @param initialState the initial state tree value
   */
  constructor(initialState = {} as T, { handlers = [] }: ArborConfig = {}) {
    this.#handlers = [...handlers, ...defaultNodeHandlers]
    this.setState(initialState)
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
   * store.state
   * => { users: [{ name: "John Doe" }]}
   * ```
   *
   * Or using a node reference:
   *
   * ```ts
   * const store = new Arbor({ users: [] })
   * store.mutate(store.state.users, node => node.push({ name: "John Doe" }))
   * store.state
   * => { users: [{ name: "John Doe" }]}
   * ```
   *
   * @param pathOrNode the path or the node within the state tree to be mutated.
   * @param mutation a function responsible for mutating the target node at the given path.
   */
  mutate<V extends object>(path: Path, mutation: Mutation<V>): void
  mutate<V extends object>(node: ArborNode<V>, mutation: Mutation<V>): void
  mutate<V extends object>(handler: NodeHandler<V>, mutation: Mutation<V>): void
  mutate<V extends object>(
    pathOrNode: ArborNode<V> | Path,
    mutation: Mutation<V>
  ): void {
    const node: INode<V> =
      pathOrNode instanceof Path
        ? pathOrNode.walk(this.#root)
        : (pathOrNode as INode<V>)

    if (!isNode(pathOrNode)) throw new NotAnArborNodeError()

    // Nodes that are no longer in the state tree or were moved into a different
    // path are considered detatched nodes and cannot be mutated otherwise we risk
    // computing incorrect state trees with values that are no longer valid.
    if (this.isDetached(node)) {
      throw new StaleNodeError()
    }

    const previousState = JSON.stringify(this.#root.$unwrap())
    const result = mutate(this.#root, node.$path, mutation)

    this.#root = result?.root

    notifyAffectedSubscribers({
      state: {
        current: result?.root,
        get previous() {
          return JSON.parse(previousState) as T
        },
      },
      metadata: result.metadata as MutationMetadata,
      mutationPath: node.$path,
    })
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
    subscribers = new Subscribers(),
    children = new NodeCache()
  ): INode<V> {
    const Handler = this.#handlers.find((F) => F.accepts(value))
    const handler = new Handler(this, path, value, children, subscribers)
    const node = new Proxy<V>(value, handler) as INode<V>

    setUUID(value)

    return node
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
  setState(value: T): INode<T> {
    const previous = this.#root?.$unwrap()
    const current = this.createNode(
      Path.root,
      value,
      this.#root?.$subscribers || new Subscribers()
    )

    this.#root = current

    notifyAffectedSubscribers({
      state: { current, previous },
      mutationPath: Path.root,
      metadata: {
        operation: "set",
        props: [],
      },
    })

    return current
  }

  /**
   * Subscribes to state tree updates.
   *
   * @param subscriber a function to be called whenever a state update occurs.
   * @returns an unsubscribe function that can be used to cancel the subscriber.
   */
  subscribe(subscriber: Subscriber): Unsubscribe {
    return this.subscribeTo(this.#root as ArborNode<T>, subscriber)
  }

  /**
   * Subscribes to mutations affecting the given Arbor node.
   *
   * @param node target node to subscribe to.
   * @param subscriber a subscriber function to be called whenever a mutation affecting the given node takes place.
   * @returns an unsubscribe function that when called cancels the related subscription.
   */
  subscribeTo<K extends object>(
    node: ArborNode<K>,
    subscriber: Subscriber
  ): Unsubscribe {
    if (!isNode(node)) throw new NotAnArborNodeError()

    return node.$subscribers.subscribe(subscriber)
  }

  /**
   * Checks if a given node is still attached to the decision tree.
   *
   * @param node node to check if no longer attached to the state tree.
   * @returns true if the node no longer exists within the decision tree, false otherwise.
   */
  isDetached(node: ArborNode<object>) {
    if (!isNode(node)) return true

    const reloadedNode = this.getNodeAt(node.$path)

    // Node no longer exists within the state tree
    if (!reloadedNode) return true

    const reloadedValue = reloadedNode.$unwrap()
    const value = node.$unwrap()
    if (getUUID(value) === getUUID(reloadedValue)) return false
    if (global.DEBUG) {
      // eslint-disable-next-line no-console
      console.warn(`Stale node pointing to path ${node.$path.toString()}`)
    }

    return true
  }

  /**
   * Allow extending Arbor's proxying behavior with new node handler implementations.
   *
   * @param handlers a list of NodeHandler implementations to register in the store.
   */
  with(...handlers: Handler[]) {
    this.#handlers = [...handlers, ...this.#handlers]
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
   * Returns the current state of the store
   */
  get state(): ArborNode<T> {
    return this.#root
  }
}
