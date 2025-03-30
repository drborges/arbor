import { MutationEvent, Subscriber, Unsubscribe, Value } from "./types"

export class Subscriptions<V extends Value = Value> {
  constructor(private subscriptions: Set<Subscriber<V>> = new Set()) {}

  subscribe(subscriber: Subscriber<V>): Unsubscribe {
    this.subscriptions.add(subscriber)

    return () => {
      this.subscriptions.delete(subscriber)
    }
  }

  notify(event: MutationEvent<V>) {
    this.subscriptions.forEach((subscriber) => {
      subscriber(event)
    })
  }

  reset() {
    this.subscriptions = new Set<Subscriber<V>>()
  }

  get size() {
    return this.subscriptions.size
  }
}
