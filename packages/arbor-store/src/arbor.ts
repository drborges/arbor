import { DefaultEngine } from "./engines"
import { DetachedNodeError, NotAnArborNodeError } from "./errors"
import { isNode } from "./guards"
import { ArrayHandler } from "./handlers/array"
import { DefaultHandler } from "./handlers/default"
import { MapHandler } from "./handlers/map"
import { Path, Seed } from "./path"
import { SeedMap } from "./seedmap"
import { Subscriptions } from "./subscriptions"
import type {
  ArborNode,
  Handler,
  Link,
  Mutation,
  Node,
  Plugin,
  Subscriber,
  Unsubscribe,
} from "./types"
import { isDetached, pathFor, recursivelyUnwrap } from "./utilities"

const attachValue =
  <T extends object>(link: Link, value: T) =>
  (_: T, node: Node<T>) => {
    node.$setChildValue(link, value)
    return {
      operation: "set",
      props: [link],
    }
  }

/*
 * Default list of state tree node Proxy handlers.
 *
 * A node Proxy handler is the mechanism in which Arbor uses to proxy access to data
 * within the state tree as well as hook into write operations so that subscribers can
 * be notified accordingly and the next state tree generated via structural sharing.
 */
const defaultHandlers = [ArrayHandler, MapHandler, DefaultHandler]

/**
 * Arbor's Observable State Tree (OST) implementation.
 *
 * Use this class to make your data observable and reactive.
 *
 * @example
 * ```
 * const store = new Arbor([
 *   { text: "todo 1" },
 *   { text: "todo 2" },
 * ])
 * ```
 *
 * The OST data structure is what powers Arbor so it may be interesting to visualize how that works.
 *
 * Here's an example, let's imagine a todo list application, you may choose to represent its state as an array of todo items,
 * the code example above creates an Arbor store that makes that state observable and reactive.
 *
 * The OST powering that state will look something like this:
 *
 *                     |array| <-- #root
 *           _____________|_____________
 *          |                           |
 *          | "0"                       | "1"
 *          |                           |
 *      |object| <-- todo 1         |object| <-- todo 2
 *
 * Where:
 *
 * 1. The root Node of the OST (`stor`.state`) is the array of todos;
 * 2. That root Node has 2 children Nodes, one for each todo object in the store;
 * 3. The indices of the array (`0` and `1`) represent the links between the root Node and its children Nodes;
 * 4. Finally, the OST is built lazily for memory efficiency. That means Nodes are created lazily as you access them
 *    from the store.
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
  readonly #handlers: Handler[]

  protected readonly engine = new DefaultEngine<T>(this)

  /**
   * List of node handlers used to extend Arbor's default proxying mechanism.
   *
   * This is an advanced feature and developers will rarely have to rely on this mechanism,
   * this is available as a way for us to quiquily experiment on new node handler implementations
   * and as a short gap to scenarios not originally accounted for. Any custom node handler
   * addressing common use cases, shall eventually be part of Arbor's internals.
   *
   * The best way to extend Arbor is to subclass it with your list of node handlers:
   *
   * @example
   *
   * ```ts
   * class TodoListHandler extends DefaultHandler<Map<unknown, TodoList>> {
   *  static accepts(value: unknown) {
   *    return value instanceof TodoList
   *  }
   *
   *  // Omitted implementation details
   * }
   *
   * class MyArbor extends Arbor<TodoList> {
   *   extensions = [TodoListHandler]
   * }
   * ```
   */
  protected readonly extensions: Handler[] = []

  /**
   * Root node of the observable state tree (OST).
   *
   * A few things to keep in mind:
   *
   * 1. Traversing the OST always starts from the root node;
   * 2. Mutations affect a specific Path within the OST, that path contains a list
   *    of seed values, each identifying a OST node composing the mutation path,
   *    this path always starts with the root node.
   */
  #root: Node<T>
  /**
   * The nodes composing the OST identified by a unique seed value assigned
   * to each node upon its creation.
   */
  #nodes = new SeedMap<Node>()
  /**
   * Links composing the OST identified by the seed of the node they connect to.
   */
  #links = new SeedMap<Link>()
  /**
   * Paths composing the OST identified by the seed of the node they point to.
   */
  #paths = new SeedMap<Path>()

  /**
   * Create a new Arbor instance.
   *
   * @param initialState the initial OST state.
   */
  constructor(initialState: T) {
    this.#handlers = [...this.extensions, ...defaultHandlers]
    this.setState(initialState)
  }

  getLinkFor(value: object): Link | undefined {
    return this.#links.getFor(value)
  }

  getNodeFor<V extends object>(value: V): Node<V> | undefined {
    return this.#nodes.getFor(value) as Node<V>
  }

  getPathFor<V extends object>(value: V): Path | undefined {
    return this.#paths.getFor(value)
  }

  getNodeAt<V extends object>(path: Path): Node<V> | undefined {
    if (path.isRoot()) {
      return this.#root as unknown as Node<V>
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
    node: DefaultHandler<V> | Node<V>,
    mutation: Mutation<V>
  ): void {
    if (!isNode(node)) {
      throw new NotAnArborNodeError()
    }

    if (isDetached(node)) {
      throw new DetachedNodeError()
    }

    const path = this.getPathFor(node)
    const result = this.engine.mutate(path, this.#root, mutation)

    this.#root = result?.root

    Subscriptions.notify({
      state: this.state,
      mutationPath: path,
      metadata: result?.metadata,
    })
  }

  traverse<V extends object>(
    parent: Node,
    link: Link,
    childValue: V
  ): Node<V> | undefined {
    if (!this.getNodeFor(childValue)) {
      const childPath = pathFor(parent).child(Seed.plant(childValue))
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
    const Handler = this.#handlers.find((F) => F.accepts(value))
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
    Seed.plant(value)
    const current = this.createNode(
      Path.root,
      recursivelyUnwrap<T>(value),
      null,
      this.#root?.$subscriptions
    )

    this.#root = current

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
      this.mutate(parentNode, attachValue(link, value))
      return parentNode.$getChildNode(link)
    }
  }

  /**
   * Subscribes to state tree updates.
   *
   * @param subscriber a function to be called whenever a state update occurs.
   * @returns an unsubscribe function that can be used to cancel the subscriber.
   */
  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    return this.subscribeTo(this.#root as ArborNode<T>, subscriber)
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
    return plugin.configure(this)
  }

  /**
   * Returns the current state of the store
   */
  get state(): ArborNode<T> {
    return this.#root
  }
}
