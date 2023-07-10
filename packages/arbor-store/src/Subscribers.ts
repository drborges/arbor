import { MutationEvent, Node, Subscriber, Unsubscribe } from "./types"

export class Subscribers<T extends object = object> {
  constructor(private subscribers: Set<Subscriber<T>> = new Set()) {}

  static notify(event: MutationEvent<object>) {
    const root = event.state as Node
    root.$subscribers.notify(event)

    event.mutationPath.walk(root, (child: Node) => {
      child.$subscribers.notify(event)
      return child
    })
  }

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

  reset() {
    this.subscribers = new Set<Subscriber<T>>()
  }

  get size() {
    return this.subscribers.size
  }
}
