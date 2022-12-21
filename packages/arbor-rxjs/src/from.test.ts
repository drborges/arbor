import { filter } from "rxjs/operators"
import Arbor, { ArborError, MutationEvent } from "@arborjs/store"
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
    const mutationEvents: MutationEvent[] = []

    observable
      .pipe(filter((event) => event.metadata.props.includes("name")))
      .forEach((event) => {
        mutationEvents.push(event)
      })

    store.root.users[0].name = "Alice Updated"
    store.root.users[0].age++

    expect(mutationEvents.length).toBe(1)
    expect(mutationEvents[0].metadata.props).toContain("name")
    expect(mutationEvents[0].mutationPath.toString()).toBe("/users/0")
  })

  it("creates an observable from an ArborNode", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ],
    })

    const observable = from(store.root.users[0])
    const mutationEvents: MutationEvent[] = []

    observable
      .pipe(filter((event) => event.metadata.props.includes("name")))
      .forEach((event) => {
        mutationEvents.push(event)
      })

    store.root.users[0].name = "Alice Updated"
    store.root.users[0].age++

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

    const observable = from(store.root.users[0])
    const mutations: MutationEvent[] = []

    const subscription = observable.subscribe((event) => {
      mutations.push(event)
    })

    subscription.unsubscribe()

    store.root.users[0].name = "Alice Updated"

    expect(mutations.length).toBe(0)
  })

  it("throws an error when observable target is not an Arbor instance nor an ArborNode", () => {
    expect(() => from(123)).toThrow(ArborError)
    expect(() => from("invalid target")).toThrow(ArborError)
    expect(() => from({ invalid: "target" })).toThrow(ArborError)
  })
})
