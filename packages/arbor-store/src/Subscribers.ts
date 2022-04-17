import { MutationEvent, Subscriber, Unsubscribe } from "./Arbor"

export default class Subscribers<T extends object> {
  constructor(private readonly subscribers: Set<Subscriber<T>> = new Set()) {}

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    this.subscribers.add(subscriber)

    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  notify(event: MutationEvent<T>) {
    this.subscribers.forEach((subscriber) => {
      subscriber(event)
    })
  }

  get size() {
    return this.subscribers.size
  }
}
