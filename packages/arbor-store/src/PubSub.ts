import Path from "./Path"
import { Node } from "./Arbor"

export type Unsubscribe = () => void

export interface MutationEvent<T extends object> {
  newState: Node<T>
  oldState: T
  mutationPath: Path
}

export type Subscriber<T extends object> = (event: MutationEvent<T>) => void

export default class PubSub<T extends object> {
  constructor(private readonly subscribers: Set<Subscriber<T>> = new Set()) {}

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    this.subscribers.add(subscriber)

    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  publish(event: MutationEvent<T>) {
    this.subscribers.forEach((s) => s(event))
  }
}
