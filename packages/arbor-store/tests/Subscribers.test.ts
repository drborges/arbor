import { describe, expect, it, vi } from "vitest"

import { Arbor } from "../src/Arbor"
import { Path } from "../src/Path"
import { Subscriptions } from "../src/Subscriptions"

describe("Subscriptions", () => {
  it("notifies subscribers of mutation events", () => {
    const subscriber1 = vi.fn()
    const subscriber2 = vi.fn()
    const subscribers = new Subscriptions()
    const mutationEvent = {
      store: new Arbor({}),
      mutationPath: Path.root,
      metadata: { operation: "", props: [] },
      state: { previous: { count: 1 }, current: { count: 2 } },
    }

    subscribers.subscribe(subscriber1)
    subscribers.subscribe(subscriber2)

    subscribers.notify(mutationEvent)

    expect(subscriber1).toHaveBeenCalledWith(mutationEvent)
    expect(subscriber2).toHaveBeenCalledWith(mutationEvent)
  })

  it("does not notify subscribers that have canceled their subscription", () => {
    const subscriber1 = vi.fn()
    const subscriber2 = vi.fn()
    const subscribers = new Subscriptions()
    const mutationEvent = {
      store: new Arbor({}),
      mutationPath: Path.root,
      metadata: { operation: "", props: [] },
      state: { previous: { count: 1 }, current: { count: 2 } },
    }

    const unsubscribe = subscribers.subscribe(subscriber1)
    unsubscribe()

    subscribers.subscribe(subscriber2)

    subscribers.notify(mutationEvent)

    expect(subscriber1).not.toHaveBeenCalled()
    expect(subscriber2).toHaveBeenCalledWith(mutationEvent)
  })

  describe("#size", () => {
    it("returns the number of subscribers registered thus far", () => {
      const subscribers = new Subscriptions()

      expect(subscribers.size).toBe(0)
      subscribers.subscribe(vi.fn())
      expect(subscribers.size).toBe(1)
      subscribers.subscribe(vi.fn())
      expect(subscribers.size).toBe(2)
    })
  })
})
