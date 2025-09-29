import { MutationEvent, Subscriber, Unsubscribe, Value } from "./types"

export class Subscriptions<V extends Value = Value> {
  constructor(private subscriptions = new Set<Subscriber<V>>()) {}

  subscribe(subscriber: Subscriber<V>): Unsubscribe {
    this.subscriptions.add(subscriber)

    return () => {
      this.subscriptions.delete(subscriber)
    }
  }

  notify(event: MutationEvent<V>) {
    for (const subscriber of this.subscriptions) {
      subscriber(event)
    }
  }

  reset() {
    this.subscriptions.clear()
  }

  get size() {
    return this.subscriptions.size
  }
}
