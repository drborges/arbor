import { Arbor } from "./Arbor"
import { Path } from "./Path"
import { Seed } from "./Seed"
import { ArborError } from "./errors"
import { isNode } from "./guards"
import {
  ArborNode,
  MutationEvent,
  Node,
  Store,
  Subscriber,
  Unsubscribe,
  Unwrappable,
} from "./types"
import { isGetter, path } from "./utilities"

// TODO: Possibly remove this type in favor of just ArborNode
export type TrackedArborNode<T extends object = object> = {
  $tracked?: boolean
} & {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? TrackedArborNode<T[K]>
    : T[K]
}

export type NotificationPredicate<T extends object> = (
  _e: MutationEvent<T>
) => boolean

export function isTracked(value: any): value is TrackedArborNode {
  return (value as TrackedArborNode)?.$tracked === true
}

export function unwrapTrackedNode<T extends object>(
  value: TrackedArborNode<T>
): ArborNode<T> {
  return (value as Unwrappable<T>).$value
}

class TrackedArbor<T extends object> implements Store<T> {
  private readonly originalStore: Arbor<T>
  private readonly targetNode: ArborNode<T>
  private readonly targetPath: Path
  private readonly cache = new WeakMap<ArborNode, TrackedArborNode>()
  private readonly tracking = new WeakMap<Seed, Set<string>>()

  constructor(
    storeOrNode: Arbor<T> | ArborNode<T> | TrackedArborNode<T>,
    readonly shouldNotifySubscribers: NotificationPredicate<T>
  ) {
    if (isTracked(storeOrNode)) {
      const node = unwrapTrackedNode(storeOrNode)
      this.originalStore = (node as Node).$tree as Arbor<T>
      this.targetNode = node
    } else if (isNode(storeOrNode)) {
      this.originalStore = storeOrNode.$tree as Arbor<T>
      this.targetNode = storeOrNode as ArborNode<T>
    } else if (storeOrNode instanceof Arbor) {
      this.originalStore = storeOrNode
      this.targetNode = storeOrNode.state as ArborNode<T>
    } else {
      throw new ArborError("track takes either an Arbor store or an ArborNode")
    }

    this.targetPath = path(this.targetNode)
  }

  get state() {
    return this.getOrCache(
      this.originalStore.getNodeAt(this.targetPath)
    ) as ArborNode<T>
  }

  setState(value: T): ArborNode<T> {
    this.originalStore.setState(value)
    return this.state
  }

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    return this.subscribeTo(this.targetNode, subscriber)
  }

  subscribeTo<V extends object>(
    node: ArborNode<V>,
    subscriber: Subscriber<T>
  ): Unsubscribe {
    return this.originalStore.subscribeTo(node, (event) => {
      if (this.affected?.(event)) {
        subscriber(event)
      }
    })
  }

  private getOrCache(node: ArborNode): TrackedArborNode {
    if (!this.cache.has(node)) {
      this.cache.set(node, this.wrap(node))
    }

    return this.cache.get(node)
  }

  // TODO: need to find a way to prevent mutations in parent components
  // causing descendents to update...
  private affected(event: MutationEvent<T>) {
    if (event.mutationPath.isRoot()) {
      return true
    }

    const targetSeed = event.mutationPath.seeds.at(-1)
    const tracked = this.tracking.get(targetSeed)

    const isTracked = event.metadata.props.some((prop) =>
      tracked?.has(prop as string)
    )

    return isTracked || this.shouldNotifySubscribers(event)
  }

  private track(seed: Seed, prop: string) {
    if (!this.tracking.has(seed)) {
      this.tracking.set(seed, new Set())
    }

    const props = this.tracking.get(seed)
    props.add(prop)
  }

  private wrap(node: ArborNode) {
    const track = this.track.bind(this)
    const getOrCache = this.getOrCache.bind(this)

    return new Proxy(node, {
      get(target, prop: string, proxy) {
        if (prop === "$tracked") {
          return true
        }

        if (prop === "$value") {
          return target
        }

        const child = Reflect.get(target, prop, proxy)

        // TODO: create a helper function that can be used
        // to check if a given prop refers to any public API
        // of Node. This way we don't risk "shadowing" actual
        // user defined methods starting with '$'
        if (prop.toString().startsWith("$")) {
          return child
        }

        const descriptor = Object.getOwnPropertyDescriptor(target, prop)

        if (!descriptor?.configurable || !descriptor.writable) {
          return child
        }

        if (
          typeof child !== "function" &&
          isNode(target) &&
          !isGetter(target, prop as string)
        ) {
          track(Seed.from(target), prop)
        }

        // TODO: handle child functions, we must set the receiver to be the proxy so map, filter, etc... can work properly

        if (typeof child !== "object") {
          return child
        }

        return getOrCache(child)
      },

      set(target, prop, newValue, proxy) {
        track(Seed.from(target), prop)

        return Reflect.set(target, prop, newValue, proxy)
      },
    })
  }
}

export function track<T extends object>(
  storeOrNode: Arbor<T> | ArborNode<T>,
  shouldNotifySubscribers: NotificationPredicate<T> = (_e: MutationEvent<T>) =>
    false
): Store<T> {
  return new TrackedArbor(storeOrNode, shouldNotifySubscribers)
}
