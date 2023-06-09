import { Arbor, ArborError, MutationEvent } from "@arborjs/store"
import { filter } from "rxjs/operators"
import { from } from "./from"

describe("from", () => {
  it("creates an observable from an Arbor store", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ],
    })

    const observable = from(store)
    const mutationEvents: MutationEvent<typeof store.state>[] = []

    observable
      .pipe(filter((event) => event.metadata.props.includes("name")))
      .forEach((event) => {
        mutationEvents.push(event)
      })
      .catch(console.error)

    store.state.users[0].name = "Alice Updated"
    store.state.users[0].age++

    expect(mutationEvents.length).toBe(1)
    expect(mutationEvents[0].metadata.props).toContain("name")
    expect(mutationEvents[0].mutationPath.toString()).toBe("/users/0")
  })

  it("cancels a subscription", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ],
    })

    const observable = from(store)
    const mutations: MutationEvent<typeof store.state>[] = []

    const subscription = observable.subscribe((event) => {
      mutations.push(event)
    })

    subscription.unsubscribe()

    store.state.users[0].name = "Alice Updated"

    expect(mutations.length).toBe(0)
  })

  it("throws an error when observable target is not an Arbor instance nor an ArborNode", () => {
    expect(() => from(123 as unknown as Arbor)).toThrow(ArborError)
    expect(() => from("invalid target" as unknown as Arbor)).toThrow(ArborError)
    expect(() => from({ invalid: "target" } as unknown as Arbor)).toThrow(
      ArborError
    )
  })
})
