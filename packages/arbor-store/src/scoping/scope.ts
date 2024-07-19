import { Arbor } from "../arbor"
import { isDetachedProperty } from "../decorators"
import { isNode } from "../guards"
import { Seed } from "../path"
import { ArborNode, MutationEvent } from "../types"
import { isGetter, recursivelyUnwrap } from "../utilities"

export type Tracked<T extends object = object> = T & {
  $tracked?: boolean
}

export class Scope<T extends object> {
  private readonly bindings = new WeakMap<object, WeakMap<object, object>>()
  private readonly cache = new WeakMap<ArborNode, Tracked>()
  private tracking = new WeakMap<Seed, Set<string>>()

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

  reset() {
    this.tracking = new WeakMap<Seed, Set<string>>()
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
            // Methods are cached after being bound to the proxy so that the reference to them
            // always yield the same memory reference.
            // This is particularly useful in libs like React, where React can determine if a
            // child component needs to be re-rendered if any of its props are updated, making
            // class methods of Arbor nodes a great option for components event handlers.
            const unwrappedTarget = recursivelyUnwrap(target)
            const unwrappedChild = Reflect.get(unwrappedTarget, prop, proxy)
            if (!bindings.has(unwrappedTarget)) {
              // Methods are bound to the proxy so that 'this' within the method context
              // points back to the proxy itself, allowing it to intercept access to nested objects.
              bindings.set(unwrappedTarget, new WeakMap())
            }

            const targetBidings = bindings.get(unwrappedTarget)
            if (!targetBidings.has(unwrappedChild)) {
              targetBidings.set(unwrappedChild, child.bind(proxy))
            }

            return bindings.get(unwrappedTarget).get(unwrappedChild)
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

        if (
          child == null ||
          child instanceof Arbor ||
          typeof child !== "object"
        ) {
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
