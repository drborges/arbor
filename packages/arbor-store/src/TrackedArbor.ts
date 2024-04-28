import { Arbor } from "./Arbor"
import { Seed } from "./Seed"
import { isDetachedProperty } from "./decorators"
import { ArborError } from "./errors"
import { isNode } from "./guards"
import {
  ArborNode,
  MutationEvent,
  Store,
  Subscriber,
  Unsubscribe,
} from "./types"
import { isGetter, path, recursivelyUnwrap } from "./utilities"

export type Tracked<T extends object = object> = T & {
  $tracked?: boolean
}

export function isArborNodeTracked<T extends object>(
  value: unknown
): value is ArborNode<T> {
  return (value as Tracked)?.$tracked === true
}

class Tracker<T extends object> {
  private readonly bindings = new WeakMap()
  private readonly cache = new WeakMap<ArborNode, Tracked>()
  private readonly tracking = new WeakMap<Seed, Set<string>>()

  getOrCache(node: ArborNode): Tracked {
    if (!this.cache.has(node)) {
      this.cache.set(node, this.wrap(node))
    }

    return this.cache.get(node)
  }

  isTracking(node: ArborNode, prop: string) {
    const seed = Seed.from(node)
    const tracked = this.tracking.get(seed)

    if (!tracked) {
      return false
    }

    return tracked.has(prop)
  }

  affected(event: MutationEvent<T>) {
    // Notify all listeners if the root of the store is replaced
    // TODO: at the moment I'm assuming this is a desirable behavior, though
    // user feedback will likely influence this behavior moving forward.
    if (event.mutationPath.isRoot() && event.metadata.operation === "set") {
      return true
    }

    // If there are no props affected by the mutation, then the operation
    // is on the node itself (e.g. array#push, array#reverse, etc...)
    if (event.metadata.props.length === 0) {
      return true
    }

    // If the affected prop was previously undefined, we know a new prop
    // is being added to the node, in which case we notify subscribers
    // since they may need to react to the new prop so it can be "discovered"
    if (event.metadata.previouslyUndefined) {
      return true
    }

    const rootSeed = Seed.from(event.state)
    const targetSeed = event.mutationPath.seeds.at(-1)
    const tracked = this.tracking.get(targetSeed || rootSeed)

    // If the affected node is not being tracked, then no need to notify
    // any subscribers.
    if (!tracked) {
      return false
    }

    // Lastly, subscribers will be notified if any of the mutated props are
    // being tracked.
    return event.metadata.props.some((prop) => tracked.has(prop as string))
  }

  track(value: object, prop?: string) {
    const seed = Seed.from(value)

    if (!this.tracking.has(seed)) {
      this.tracking.set(seed, new Set())
    }

    if (prop != null) {
      this.tracking.get(seed).add(prop)
    }
  }

  private wrap(node: ArborNode) {
    const bindings = this.bindings
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
        const descriptor = Object.getOwnPropertyDescriptor(target, prop)

        // Unconfigurable and non-writable properties will return the underlying
        // proxied value in order to conform to Proxy invariants.
        if (!descriptor?.configurable || !descriptor.writable) {
          if (typeof child === "function") {
            if (!bindings.has(child)) {
              // Methods must be bound to the proxy so that 'this' within the method context
              // points back to the proxy itself, allowing it to wrap children nodes as needed.
              // Note that JS does not allow to re-bind a function, that is why we must first
              // unwrap the proxied target so we can bind the original method (e.g. 'child) to
              // the proxy.
              const unwrapped = recursivelyUnwrap(target)
              const unwrappedChild = Reflect.get(unwrapped, prop, proxy)
              bindings.set(child, unwrappedChild.bind(proxy))
            }

            return bindings.get(child)
          }

          return child
        }

        if (
          isNode(target) &&
          !isGetter(target, prop as string) &&
          !isDetachedProperty(target, prop)
        ) {
          track(target, prop)
        }

        if (child == null || typeof child !== "object") {
          return child
        }

        return getOrCache(child)
      },

      set(target, prop, newValue, proxy) {
        track(target, prop)

        return Reflect.set(target, prop, newValue, proxy)
      },
    })
  }
}

// TODO: rename this to something that reflects its intention, which is the creation
// of a store for a subtree in the given store.
export class TrackedArbor<T extends object> implements Store<T> {
  protected originalStore: Arbor<T>
  protected targetNode: ArborNode<T>
  readonly tracker = new Tracker()

  constructor(storeOrNode: Arbor<T> | ArborNode<T>) {
    if (isNode(storeOrNode)) {
      this.originalStore = storeOrNode.$tree as Arbor<T>
      this.targetNode = storeOrNode as ArborNode<T>
    } else if (storeOrNode instanceof Arbor) {
      this.originalStore = storeOrNode
      this.targetNode = storeOrNode.state as ArborNode<T>
    } else {
      throw new ArborError("track takes either an Arbor store or an ArborNode")
    }

    this.tracker.track(this.targetNode)
  }

  get state() {
    return this.tracker.getOrCache(
      this.originalStore.getNodeAt(path(this.targetNode))
    ) as ArborNode<T>
  }

  setState(value: T): ArborNode<T> {
    this.targetNode = this.originalStore.setNode(this.targetNode, value)

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
      if (this.tracker.affected(event)) {
        subscriber(event)
      }
    })
  }
}
