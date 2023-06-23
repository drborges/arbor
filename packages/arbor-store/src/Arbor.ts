import { ArrayNodeHandler } from "./ArrayNodeHandler"
import { Children } from "./Children"
import { MapNodeHandler } from "./MapNodeHandler"
import { NodeHandler } from "./NodeHandler"
import { Path } from "./Path"
import { Subscribers } from "./Subscribers"
import { DetachedNodeError, NotAnArborNodeError } from "./errors"
import { isNode } from "./guards"
import type {
  ArborNode,
  Handler,
  Mutation,
  Node,
  Plugin,
  Subscriber,
  Unsubscribe,
} from "./types"
import { isDetached } from "./utilities"

function mutate<T extends object, K extends object>(
  node: Node<T>,
  path: Path,
  mutation: Mutation<K>
) {
  try {
    const root = node.$clone()

    const targetNode = path.walk<Node<K>>(root, (child: Node, parent: Node) => {
      const childCopy = child.$clone()

      parent.$children.set(childCopy.$value, childCopy)

      return childCopy
    })

    const metadata = mutation(targetNode.$value)

    return {
      root,
      metadata,
    }
  } catch (e) {
    return undefined
  }
}

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
  #handlers: Handler[]

  /**
   * Reference to the root node of the state tree
   */
  #root: Node<T>

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
   * Create a new Arbor instance.
   *
   * @param initialState the initial state tree value
   */
  constructor(initialState: T) {
    this.#handlers = [...this.extensions, ...defaultNodeHandlers]
    this.setState(initialState)
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
  mutate<V extends object>(node: ArborNode<V>, mutation: Mutation<V>): void
  mutate<V extends object>(handler: NodeHandler<V>, mutation: Mutation<V>): void
  mutate<V extends object>(node: unknown, mutation: Mutation<V>): void {
    if (!isNode(node)) throw new NotAnArborNodeError()

    // Nodes that are no longer in the state tree or were moved into a different
    // path are considered detatched nodes and cannot be mutated otherwise we risk
    // computing incorrect state trees with values that are no longer valid.
    if (isDetached(node)) {
      throw new DetachedNodeError()
    }

    const result = mutate(this.#root, node.$path, mutation)

    this.#root = result?.root

    Subscribers.notify({
      state: this.state,
      mutationPath: node.$path,
      metadata: result.metadata ? result.metadata : null,
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
    subscribers = new Subscribers<T>(),
    children = new Children()
  ) {
    const Handler = this.#handlers.find((F) => F.accepts(value))
    const handler = new Handler(this, path, value, children, subscribers)
    const node = new Proxy<V>(value, handler)

    return node as Node<V>
  }

  /**
   * Retrieves a node from the state tree by its path.
   *
   * @param path the path of the node to be retrieved.
   * @returns the node at the given path.
   */
  getNodeAt<V extends object>(path: Path): ArborNode<V> {
    return path.walk(this.#root)
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
      value,
      this.#root?.$subscribers || new Subscribers<T>()
    )

    this.#root = current

    Subscribers.notify({
      state: this.state,
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
  subscribeTo<K extends object>(
    node: ArborNode<K>,
    subscriber: Subscriber<T>
  ): Unsubscribe {
    if (!isNode(node)) throw new NotAnArborNodeError()

    return node.$subscribers.subscribe(subscriber)
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
