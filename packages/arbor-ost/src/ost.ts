import { Path } from "./path"
import { Seed } from "./seed"
import { $map } from "./handlers/$map"
import { $set } from "./handlers/$set"
import { $array } from "./handlers/$array"
import { $object } from "./handlers/$object"
import { DetachedPathError } from "./errors"
import { Subscriptions } from "./subscriptions"
import {
  $,
  Mutation,
  Node,
  ProxyHandlerConstructor,
  Subscriber,
  Value,
} from "./types"

export class OST<V extends Value = Value> {
  /**
   * Represents the root of the tree
   */
  #rootSeed: Seed
  /**
   * Map every observable value in the state to their corresponding Seed
   */
  #seeds = new WeakMap<Value, Seed>()
  /**
   * Map each created Seed to the OST Node they correspond to
   */
  #nodes = new WeakMap<Seed, Node>()
  /**
   * Map each Seed to the Path that locates the corresponding Node in the OST
   */
  #paths = new WeakMap<Seed, Path>()
  /**
   * Map each Seed to the subscription registry tracking every subscriber to the corresponding Node.
   */
  #subscriptions = new WeakMap<Seed, Subscriptions>()

  /**
   * List of supported NodeHandlers
   *
   * Node handlers are used as proxy handlers when creating the Proxy representing an OST Node
   *
   * They are responsible for providing the behavior of the Node, e.g. behaves like a regular object vs array vs map vs set, etc...
   */
  #handlers: ProxyHandlerConstructor[] = [$array, $set, $map, $object]

  constructor(root?: V) {
    if (root) {
      this.createNode(root)
    }
  }

  createNode<V extends Value = Value>(
    value: V,
    path = Path.root(),
    subscriptions = new Subscriptions()
  ): $<V> {
    const seed = path.target
    const handler = this.#handlers.find((h) => h.accepts(value))
    const $node = new Proxy(value, new handler(this)) as $<V>

    if (path.isRoot()) {
      this.#rootSeed = seed
    }

    this.#seeds.set(value, seed)
    this.#nodes.set(seed, $node)
    this.#paths.set(seed, path)
    this.#subscriptions.set(seed, subscriptions)

    return $node
  }

  mutate<T extends Value = Value>($node: Node<T>, mutation: Mutation<T>) {
    if (this.isDetached($node.$value)) {
      throw new DetachedPathError(this.humanizePath($node.$path))
    }

    const refreshedNodesInMutationPath = this.refreshNodesInPath($node.$path)
    const $newRootNode = refreshedNodesInMutationPath[0]
    const $newTargetNode = refreshedNodesInMutationPath.at(-1) as $<T>
    const metadata = mutation($newTargetNode)

    this.#rootSeed = $newRootNode.$seed

    for (const $refreshedNode of refreshedNodesInMutationPath) {
      $refreshedNode.$subscriptions.notify({
        target: $newTargetNode,
        metadata,
      })
    }

    return $newTargetNode
  }

  subscribe(s: Subscriber<V>) {
    return this.subscribeTo(this.root, s)
  }

  subscribeTo<T extends Value = Value>($node: Node<T>, s: Subscriber<T>) {
    return this.subscriptionsOf($node.$value).subscribe(s)
  }

  nodeOf(value: Value): Node {
    const seed = this.#seeds.get(value)
    return this.#nodes.get(seed)
  }

  seedOf(value: Value): Seed {
    // Cannot call node.$seed here since that would create a circular dependency
    return this.#seeds.get(value)
  }

  pathOf(value: Value): Path {
    // Cannot call node.path here since that would create a circular dependency
    return this.#paths.get(this.#seeds.get(value))
  }

  parentOf(value: Value): Node {
    // Cannot call node.$parent here since that would create a circular dependency
    const path = this.#paths.get(this.#seeds.get(value))
    return this.#nodes.get(path.parentSeed)
  }

  subscriptionsOf(value: Value): Subscriptions {
    // Cannot call node.$subscriptions here since that would create a circular dependency
    return this.#subscriptions.get(this.#seeds.get(value))
  }

  isDetached(value?: Value) {
    const path = this.pathOf(value)
    return !path || path.seeds.some(this.isDetachedSeed.bind(this))
  }

  humanizePath(path: Path) {
    return path.humanize((seed) =>
      this.isDetachedSeed(seed) ? `${seed.value}*` : seed.value.toString()
    )
  }

  get root() {
    return this.#nodes.get(this.#rootSeed) as $<V>
  }

  private refreshNodesInPath(path: Path) {
    return path.seeds.map((seed) => this.refreshNodeBySeed(seed))
  }

  private refreshNodeBySeed(seed: Seed) {
    const $affectedNode = this.#nodes.get(seed)
    return this.createNode(
      $affectedNode.$value,
      $affectedNode.$path,
      $affectedNode.$subscriptions
    )
  }

  private isDetachedSeed(seed: Seed) {
    const $node = this.#nodes.get(seed)

    if ($node.$parent == null) {
      return $node !== this.root
    }

    for (const child of $node.$parent.$children()) {
      if ($node.$value === child.$value) {
        return false
      }
    }

    return true
  }
}
