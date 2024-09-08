import { Arbor } from "../arbor"
import { isDetachedProperty } from "../decorators"
import { isNode } from "../guards"
import { Seed } from "../path"
import { ArborNode, Link, MutationEvent, Node } from "../types"
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

  // NOTE: Something to consider in the future as new node handler types
  // are introduced, is whether or not this method should be aware of the
  // type of node handler targeted by the event so it can better determine
  // when a mutation affects that node or not.
  //
  // For instance, currently we assume that any operation other than "set"
  // should affect the node, e.g. subscribers need to be notified, this is
  // to deal with scenarios where a subscriber may not be tracking any fields
  // of an array, but yet needs to know when it changes.
  //
  // Imagine in a React app a component that renders the length of an array
  // but does not access any items in the array, it needs to re-render whenever
  // an item is removed or added to the array.This implementation is not 100%
  // ideal at the moment since for instance, that same component would re-render
  // should we use Array#reverse or Array#sort, these won't change the array's
  // length and yet will cause the component to re-render.
  //
  // One idea to explore is to provide extra metadata information in the mutation
  // event that would allow this logic to tap into in order to determine whether
  // subscribers should be notified regardless of which fields on the node they
  // are tracking, similar to how we use `MutationMetadata#previouslyUndefined`.
  //
  // We can try replacing that with `MutationMetadata#structureChanged` to indicate
  // when a mutation event alters the structure of the node by either adding new fields
  // or removing.
  affected(event: MutationEvent<T>) {
    if (event.metadata.operation !== "set") {
      return true
    }

    // Notify all listeners if the root of the store is replaced
    if (
      event.mutationPath.isRoot() &&
      event.metadata.operation === "set" &&
      event.metadata.props.length === 0
    ) {
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
      get(target: Node, prop, proxy) {
        if (prop === "$tracked") {
          return true
        }

        if (prop === "$value") {
          return target
        }

        // Scopes must be able to intercept iteration logic so that items being traversed
        // can be wrapped within a scope proxy so that path tracking can happen.
        //
        // To achieve that, in Arbor, every NodeHandler that needs to support iterators,
        // like arrays and maps, implement their own *[Symbol.iterator] method that accepts
        // a proxy function as their argument, this function is provided by the scope and
        // allows the iterator to wrap each item being iterated within a scope that provides
        // path tracking behavior.
        if (prop === Symbol.iterator && target[prop] != null) {
          return function* iterator() {
            const iterate = target[Symbol.iterator].bind(target)
            for (const entry of iterate(getOrCache)) {
              yield entry
            }
          }
        }

        // TODO: find a solution that does not involve overriding a possible get method
        // on the target...
        //
        // TODO: handlers/map.ts must intercept child access so it can proxy them
        // otherwise, accessing a child from a scoped map will not yield a scoped
        // child but the actual underlying value.
        if (target instanceof Map && prop === "get") {
          return (link: Link) => {
            const child = target.get(link)

            return isNode(child) ? getOrCache(child) : child
          }
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
          !isDetachedProperty(target, prop as string)
        ) {
          track(target, prop)
        }

        if (
          child == null ||
          // There's no point in tracking access to Arbor stores being referenced
          // without other stores since they are not connected to each other.
          // Also, we cannot proxy Arbor instance since itself relies on #private
          // fields to hide internal concerns which gets in the way of the proxying
          // mechanism.
          //
          // See "Private Properties" section of the Caveats.md for more details.
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
