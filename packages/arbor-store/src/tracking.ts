import { Arbor } from "./Arbor"
import { Seed } from "./Seed"
import { ArborError } from "./errors"
import { isNode } from "./guards"
import {
  ArborNode,
  MutationEvent,
  Store,
  Subscriber,
  Unsubscribe,
} from "./types"
import { isGetter, recursivelyUnwrap, unwrap } from "./utilities"

export type TrackedArborNode<T extends object = object> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? TrackedArborNode<T[K]>
    : T[K]
}

class TrackedArbor<T extends object> implements Store<T> {
  private readonly originalStore: Arbor<T>
  private readonly targetNode: ArborNode<T>
  private readonly cache = new WeakMap<Seed, TrackedArborNode>()
  private readonly tracking = new WeakMap<Seed, Set<string>>()

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
  }

  get state() {
    return this.wrap(this.originalStore.state)
  }

  setState(value: T): ArborNode<T> {
    return this.originalStore.setState(value)
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

  private affected(event: MutationEvent<object>) {
    if (event.mutationPath.isRoot()) {
      return true
    }

    const tracked = this.tracking.get(event.mutationPath.seeds.at(-1))

    return event.metadata.props.some((prop) => tracked?.has(prop as string))
  }

  private track(seed: Seed, prop: string) {
    if (!this.tracking.has(seed)) {
      this.tracking.set(seed, new Set())
    }

    const props = this.tracking.get(seed)

    if (!props.has(prop)) {
      props.add(prop)
    }
  }

  private wrap<K extends object>(node: ArborNode<K>) {
    const cache = this.cache
    const wrap = this.wrap.bind(this)
    const track = this.track.bind(this)

    return new Proxy(node, {
      get(target, prop: string, proxy) {
        // This is important so that ArborNodes are unwrapped properly
        if (prop === "$value") {
          return unwrap(node)
        }

        const child = Reflect.get(target, prop, proxy) as ArborNode<T>

        const targetseed = Seed.from(target)

        if (typeof child !== "function" && isNode(target)) {
          const unwrapped = recursivelyUnwrap(target)

          if (!isGetter(unwrapped, prop as string)) {
            track(targetseed, prop)
          }
        }

        if (typeof child !== "object") {
          return child
        }

        const childSeed = Seed.from(child)

        if (!cache.has(childSeed)) {
          cache.set(childSeed, wrap(child))
        }

        return cache.get(childSeed)
      },

      // set(target, prop, newValue) {
      //   return Reflect.set(target, prop, newValue, target);
      // }
    })
  }
}

export function track<T extends object>(store: Arbor<T>): Store<T> {
  return new TrackedArbor(store)
}
