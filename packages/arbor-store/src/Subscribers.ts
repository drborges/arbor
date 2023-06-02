import { MutationMetadata } from "./mutate"
import Path from "./Path"

/**
 * Describes a function used by users to cancel their state updates subscription.
 */
export type Unsubscribe = () => void

/**
 * Describes a mutation event passed to subscribers
 */
export type MutationEvent = {
  // TODO: consider not exposing reactive state to plugins.
  // If plugins wish to trigger mutations, perhaps it's a
  // better idea to be explicit, and retrieve the node to
  // mutate from the state tree.
  state: { current?: object; previous?: object }
  mutationPath: Path
  metadata: MutationMetadata
}

/**
 * Subscriber function used to listen to mutation events triggered by the state tree.
 */
export type Subscriber = (event: MutationEvent) => void

export default class Subscribers {
  constructor(private readonly subscribers: Set<Subscriber> = new Set()) {}

  subscribe(subscriber: Subscriber): Unsubscribe {
    this.subscribers.add(subscriber)

    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  notify(event: MutationEvent) {
    this.subscribers.forEach((subscriber) => {
      subscriber(event)
    })
  }

  get size() {
    return this.subscribers.size
  }
}
