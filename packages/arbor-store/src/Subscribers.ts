import { MutationEvent, Node, Subscriber, Unsubscribe } from "./types"

export default class Subscribers<T extends object = object> {
  constructor(private readonly subscribers: Set<Subscriber<T>> = new Set()) {}

  static notify(event: MutationEvent<object>) {
    const root = event.state as Node
    root.$subscribers.notify(event)

    event.mutationPath.walk(root, (child: Node) => {
      child.$subscribers.notify(event)
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

  get size() {
    return this.subscribers.size
  }
}
