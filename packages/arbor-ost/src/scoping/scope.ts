/* eslint-disable @typescript-eslint/no-explicit-any */
import { OST } from "../ost"
import { $, Node, Subscriber, Unsubscribe, Value } from "../types"
import { $default } from "./handlers/$default"
import { $map } from "./handlers/$map"
import { $set } from "./handlers/$set"

export class Scope<V extends Value> {
  #handlers = [$map, $set, $default]

  constructor(
    readonly ost: OST<V>,
    readonly proxies = new WeakMap<Value, Node>(),
    readonly tracked = new WeakMap<Value, Set<unknown>>()
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

  createProxy($node: Node) {
    const seed = $node.$seed

    if (this.proxies.has(seed)) {
      return this.proxies.get(seed)
    }

    if (!this.tracked.has(seed)) {
      this.tracked.set(seed, new Set())
    }

    const handler = this.#handlers.find(h => h.accepts($node))
    const proxy = new Proxy($node, new handler(this))

    this.proxies.set(seed, proxy)

    return proxy
  }
}
