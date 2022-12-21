import { MutationMetadata } from "./mutate"
import Path from "./Path"

/**
 * Describes a function used by users to cancel their state updates subscription.
 */
export type Unsubscribe = () => void

/**
 * Describes a mutation event passed to subscribers
 */
export type MutationEvent<T = object> = {
  state: { current?: T; previous?: T }
  mutationPath: Path
  metadata: MutationMetadata
}

/**
 * Subscriber function used to listen to mutation events triggered by the state tree.
 */
export type Subscriber<T> = (event: MutationEvent<T>) => void

export default class Subscribers<T extends object = object> {
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
