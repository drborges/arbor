/* eslint-disable @typescript-eslint/no-explicit-any */
import { OST } from "../ost"
import { $, Node, Subscriber, Unsubscribe, Value } from "../types"
import { isProxiable } from "../handlers/$object/visitors/proxiable"

export class Scope<V extends Value> {
  constructor(
    readonly ost: OST<V>,
    protected readonly proxies = new WeakMap<Value, Node>(),
    protected readonly tracked = new WeakMap<Value, Set<unknown>>()
  ) {}

  get root(): $<V> {
    return this.createProxy(this.ost.root) as $<V>
  }

  subscribe(subscriber: Subscriber): Unsubscribe {
    return this.ost.subscribe((event) => {
      const seed = event.target.$seed
      const trackedNode = this.tracked.get(seed)
      if (
        trackedNode &&
        (event.metadata.operation !== "set" ||
          trackedNode.has(event.metadata.args[0]))
      ) {
        subscriber(event)
      }
    })
  }

  private createProxy($node: Node) {
    const seed = $node.$seed

    if (this.proxies.has(seed)) {
      return this.proxies.get(seed)
    }

    if (!this.tracked.has(seed)) {
      this.tracked.set(seed, new Set())
    }

    const tracked = this.tracked
    const createProxy = this.createProxy.bind(this)
    const proxy = new Proxy($node, {
      get($node, prop, receiver) {
        if (prop != null) {
          tracked.get(seed).add(prop)
        }

        // TODO: Implement visitors for different types of nodes so we can proxy children accordingly
        const child = Reflect.get($node, prop, receiver)

        return isProxiable(child) ? createProxy(child) : child
      },
    })

    this.proxies.set(seed, proxy)

    return proxy
  }
}
