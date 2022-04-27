import Path from "./Path"
import Subscribers from "./Subscribers"

describe("Subscribers", () => {
  it("notifies subscribers of mutation events", () => {
    const subscriber1 = jest.fn()
    const subscriber2 = jest.fn()
    const subscribers = new Subscribers()
    const mutationEvent = {
      mutationPath: Path.root,
      state: { previous: { count: 1 }, current: { count: 2 } },
    }

    subscribers.subscribe(subscriber1)
    subscribers.subscribe(subscriber2)

    subscribers.notify(mutationEvent)

    expect(subscriber1).toHaveBeenCalledWith(mutationEvent)
    expect(subscriber2).toHaveBeenCalledWith(mutationEvent)
  })

  it("does not notify subscribers that have canceled their subscription", () => {
    const subscriber1 = jest.fn()
    const subscriber2 = jest.fn()
    const subscribers = new Subscribers()
    const mutationEvent = {
      mutationPath: Path.root,
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
      const subscribers = new Subscribers()

      expect(subscribers.size).toBe(0)
      subscribers.subscribe(jest.fn())
      expect(subscribers.size).toBe(1)
      subscribers.subscribe(jest.fn())
      expect(subscribers.size).toBe(2)
    })
  })
})
