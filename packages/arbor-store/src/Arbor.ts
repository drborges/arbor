import { DetachedNodeError, NotAnArborNodeError } from "./errors"
import { isNode } from "./guards"
import { ArrayNodeHandler } from "./handlers/ArrayNodeHandler"
import { MapNodeHandler } from "./handlers/MapNodeHandler"
import { NodeHandler } from "./handlers/NodeHandler"
import { MutationEngine } from "./MutationEngine"
import { Path, Seed } from "./path"
import { Subscriptions } from "./Subscriptions"
import type {
  ArborNode,
  Handler,
  Link,
  Mutation,
  Node,
  Plugin,
  Store,
  Subscriber,
  Unsubscribe,
} from "./types"
import { isDetached, pathFor, recursivelyUnwrap } from "./utilities"

const attachValue =
  <T extends object>(value: T, link: Link) =>
  (_: T, node: Node<T>) => {
    node.$setChildValue(value, link)
    return {
      operation: "set",
      props: [link],
    }
  }

/**
 * Refreshes the nodes affected by the mutation path via structural sharing
 * at the state tree level, not affecting the values wrapped by the state
 * tree nodes.
 *
 * The algorithm is simple and allows computing diffs of the state tree
 * via simple referential equality checks, which comes quite handy in
 * contexts such as React's which can optimally re-compute re-renders
 * via reference checks.
 *
 * Here's a more concrete example, take the following store:
 *
 * cosnt store = new Arbor({
 *   todos: [
 *     { id: 1, text: "Clean the house", done: false },
 *      { id: 2, text: "Walk the dogs", done: false },
 *   ]
 * })
 *
 * That can be represented by the following state tree:
 *
 *               "/"
 *                |
 *             "todos"
 *           _____|_____
 *          |           |
 *         "0"         "1"
 *
 * where the follow is true:
 *
 * 1. `store.state` is referenced by the state tree path `"/"`
 * 2. `store.state.todos` is referenced by the state tree path `"/todos"`
 * 3. `store.state.todos[0]` is referenced by the state tree path `"/todos/0"`
 * 4. `store.state.todos[1]` is referenced by the state tree path `"/todos/1"`
 *
 * When mutations are applied to say path `"/todos/0"`, all nodes belonging to that path
 * are refreshed via structural sharing, ultimately not affecting nodes outside of that path,
 * for example:
 *
 * `store.state.todos[0].done = true`: causes all nodes intersecting `"/todos/0"` to be refreshed, e.g.
 * `"/"`, `"/todos"` and `"/todos/0"`, leaving `"/todos/1"` untouched.
 */

/*
 * Default list of state tree node Proxy handlers.
 *
 * A node Proxy handler is the mechanism in which Arbor uses to proxy access to data
 * within the state tree as well as hook into write operations so that subscribers can
 * be notified accordingly and the next state tree generated via structural sharing.
 */
const defaultNodeHandlers = [ArrayNodeHandler, MapNodeHandler, NodeHandler]

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
export class Arbor<T extends object = object> {
  /**
   * List of proxy handlers used to determine at Runtime which handling strategy to use
   * for proxying a given node within the state tree.
   *
   * By default Arbor has built-in node implementations that can handle arrays, map, object literal
   * and any custom type that is Proxiable by Arbor.
   *
   * Users can extend this list with new strategies allowing them to customize the proxying
   * behavior of Arbor.
   */
  private readonly handlers: Handler[]

  protected readonly engine = new MutationEngine<T>(this)

  /**
   * List of node handlers used to extend Arbor's default proxying mechanism.
   *
   * The best way to extend Arbor is to subclass it with your list of node handlers:
   *
   * @example
   *
   * ```ts
   * class TodoListNodeHandler extends NodeHandler<Map<unknown, TodoList>> {
   *  static accepts(value: unknown) {
   *    return value instanceof TodoList
   *  }
   *
   *  // Omitted implementation details
   * }
   *
   * class MyArbor extends Arbor<TodoList> {
   *   extensions = [TodoListNodeHandler]
   * }
   * ```
   */
  protected readonly extensions: Handler[] = []

  /**
   * Reference to the root node of the state tree
   */
  root: Node<T>

  #links = new WeakMap<Seed, Link>()
  #nodes = new WeakMap<Seed, Node>()
  #paths = new WeakMap<Seed, Path>()

  /**
   * Create a new Arbor instance.
   *
   * @param initialState the initial state tree value
   */
  constructor(initialState: T) {
    this.handlers = [...this.extensions, ...defaultNodeHandlers]
    this.setState(initialState)
  }

  getLinkFor(value: object): Link | undefined {
    return this.#links.get(Seed.from(value))
  }

  getNodeFor<V extends object>(value: V): Node<V> | undefined {
    return this.#nodes.get(Seed.from(value)) as Node<V>
  }

  getPathFor<V extends object>(value: V): Path | undefined {
    return this.#paths.get(Seed.from(value))
  }

  getNodeAt<V extends object>(path: Path): Node<V> | undefined {
    if (path.isRoot()) {
      return this.root as unknown as Node<V>
    }

    return this.#nodes.get(path.seeds.at(-1)) as Node<V>
  }

  detachNodeFor<V extends object>(value: V) {
    const node = this.getNodeFor(value)

    if (node) {
      const seed = Seed.from(node)

      node.$subscriptions.reset()
      this.#nodes.delete(seed)
      this.#links.delete(seed)
      this.#paths.delete(seed)
    }
  }

  attachNode(node: Node, link?: Link, path?: Path) {
    const seed = Seed.from(node)

    if (seed) {
      this.#nodes.set(seed, node)
      this.#links.set(seed, link)

      if (path) {
        this.#paths.set(seed, path)
      }
    }
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
   * store.mutate(store.state.users, node => node.push({ name: "John Doe" }))
   * store.state
   * => { users: [{ name: "John Doe" }]}
   * ```
   *
   * @param node the node within the state tree to be mutated.
   * @param mutation a function that performs the mutation to the node.
   */
  mutate<V extends object>(
    node: NodeHandler<V> | Node<V>,
    mutation: Mutation<V>
  ): void {
    if (!isNode(node)) {
      throw new NotAnArborNodeError()
    }

    if (isDetached(node)) {
      throw new DetachedNodeError()
    }

    const path = this.getPathFor(node)
    const result = this.engine.mutate(path, mutation)

    this.root = result?.root

    Subscriptions.notify({
      state: this.state,
      mutationPath: path,
      metadata: result.metadata,
    })
  }

  traverse<V extends object>(
    parent: Node,
    link: Link,
    childValue: V
  ): Node<V> | undefined {
    if (!this.getNodeFor(childValue)) {
      const childSeed = Seed.plant(childValue)
      const childPath = pathFor(parent).child(childSeed)
      this.createNode(childPath, childValue, link)
    }

    return this.getNodeFor(childValue)
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
    link?: Link,
    subscriptions = new Subscriptions<V>()
  ): Node<V> {
    Seed.plant(value)
    const Handler = this.handlers.find((F) => F.accepts(value))
    const handler = new Handler(this, value, subscriptions)
    const node = new Proxy<V>(value, handler) as Node<V>

    this.attachNode(node, link, path)

    return node
  }

  /**
   * Sets a given value as the root node of the state tree.
   *
   * @param value the value to be used as the root of the state tree.
   * @returns the root node.
   */
  setState(value: T): ArborNode<T> {
    const current = this.createNode(
      Path.root,
      recursivelyUnwrap<T>(value),
      null,
      this.root?.$subscriptions
    )

    this.root = current

    Subscriptions.notify({
      state: this.state,
      mutationPath: Path.root,
      metadata: {
        operation: "set",
        props: [],
      },
    })

    return current
  }

  setNode<K extends object>(
    node: ArborNode<K>,
    value: K | T
  ): ArborNode<K> | ArborNode<T> {
    const link = this.getLinkFor(node)
    const targetPath = pathFor(node)
    this.detachNodeFor(node)

    if (targetPath.isRoot()) {
      return this.setState(value as T)
    } else {
      const parentNode = this.getNodeAt(targetPath.parent)
      this.mutate(parentNode, attachValue(value, link))
      return parentNode.$getChildNode(link)
    }
  }

  cloneNode<V extends object>(node: Node<V>): Node<V> {
    return this.createNode<V>(
      this.getPathFor(node),
      node.$value,
      this.getLinkFor(node),
      node.$subscriptions
    )
  }

  /**
   * Subscribes to state tree updates.
   *
   * @param subscriber a function to be called whenever a state update occurs.
   * @returns an unsubscribe function that can be used to cancel the subscriber.
   */
  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    return this.subscribeTo(this.root as ArborNode<T>, subscriber)
  }

  /**
   * Subscribes to mutations affecting the given Arbor node.
   *
   * @param node target node to subscribe to.
   * @param subscriber a subscriber function to be called whenever a mutation affecting the given node takes place.
   * @returns an unsubscribe function that when called cancels the related subscription.
   */
  subscribeTo<V extends object>(
    node: ArborNode<V>,
    subscriber: Subscriber<T>
  ): Unsubscribe {
    if (!isNode(node)) throw new NotAnArborNodeError()

    return node.$subscriptions.subscribe(subscriber)
  }

  /**
   * Register plugins to extend the store capabilities.
   *
   * @param plugin plugin to extend the store with.
   * @returns a promise that gets resolved when the plugin completes its configuration steps.
   */
  use(plugin: Plugin<T>) {
    return plugin.configure(this as Store<T>)
  }

  /**
   * Returns the current state of the store
   */
  get state(): ArborNode<T> {
    return this.root
  }
}
