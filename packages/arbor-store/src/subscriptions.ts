import { MutationEvent, Node, Subscriber, Unsubscribe } from "./types"

export class Subscriptions<T extends object = object> {
  constructor(private subscriptions: Set<Subscriber<T>> = new Set()) {}

  static notify(event: MutationEvent<object>) {
    const root = event.state as Node

    event.mutationPath.walk(root, (child: Node) => {
      child.$subscriptions.notify(event)
      return child
    })
  }

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    this.subscriptions.add(subscriber)

    return () => {
      this.subscriptions.delete(subscriber)
    }
  }

  notify(event: MutationEvent<T>) {
    this.subscriptions.forEach((subscriber) => {
      subscriber(event)
    })
  }

  reset() {
    this.subscriptions = new Set<Subscriber<T>>()
  }

  get size() {
    return this.subscriptions.size
  }
}
