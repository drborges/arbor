import Path from "./Path"
import { Node } from "./Arbor"
import PubSub, { MutationEvent } from "./PubSub"

interface Counter {
  count: number
}

describe("PubSub", () => {
  it("notifies all subscribers of a specific event", () => {
    const subscriber1 = jest.fn()
    const subscriber2 = jest.fn()
    const event: MutationEvent<Counter> = {
      newState: { count: 1 } as Node<Counter>,
      oldState: { count: 0 },
      mutationPath: Path.root,
    }

    const pubsub = new PubSub<Counter>()
    pubsub.subscribe(subscriber1)
    pubsub.subscribe(subscriber2)

    pubsub.publish(event)

    expect(subscriber1).toHaveBeenCalledWith(event)
    expect(subscriber2).toHaveBeenCalledWith(event)
  })

  it("unsubscribes a subscriber from further published events", () => {
    const subscriber1 = jest.fn()
    const subscriber2 = jest.fn()
    const event: MutationEvent<Counter> = {
      newState: { count: 1 } as Node<Counter>,
      oldState: { count: 0 },
      mutationPath: Path.root,
    }

    const pubsub = new PubSub<Counter>()
    const unsubscribe = pubsub.subscribe(subscriber1)
    pubsub.subscribe(subscriber2)

    unsubscribe()
    pubsub.publish(event)

    expect(subscriber1).not.toHaveBeenCalled()
    expect(subscriber2).toHaveBeenCalledWith(event)
  })
})
