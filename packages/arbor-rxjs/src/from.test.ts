import { filter } from "rxjs/operators"
import Arbor, { MutationEvent } from "@arborjs/store"
import { from } from "./from"

interface User {
  name: string
  age: number
}

describe("from", () => {
  it("creates an observable from an Arbor store", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ],
    })

    const observable = from(store)
    const mutations: MutationEvent<{ users: User[] }>[] = []

    observable
      .pipe(filter((mutation) => mutation.metadata.props.includes("name")))
      .forEach((mutation) => {
        mutations.push(mutation)
      })

    store.root.users[0].name = "Alice Updated"
    store.root.users[0].age++

    expect(mutations.length).toBe(1)
    expect(mutations[0].metadata.props).toContain("name")
    expect(mutations[0].mutationPath.toString()).toBe("/users/0")
  })

  it("creates an observable from an ArborNode", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ],
    })

    const observable = from(store.root.users[0])
    const mutations: MutationEvent<User>[] = []

    observable
      .pipe(filter((mutation) => mutation.metadata.props.includes("name")))
      .forEach((mutation) => {
        mutations.push(mutation)
      })

    store.root.users[0].name = "Alice Updated"
    store.root.users[0].age++

    expect(mutations.length).toBe(1)
    expect(mutations[0].metadata.props).toContain("name")
    expect(mutations[0].mutationPath.toString()).toBe("/users/0")
  })

  it("cancels a subscription", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ],
    })

    const observable = from(store.root.users[0])
    const mutations: MutationEvent<User>[] = []

    const subscription = observable.subscribe((event) => {
      mutations.push(event)
    })

    subscription.unsubscribe()

    store.root.users[0].name = "Alice Updated"

    expect(mutations.length).toBe(0)
  })
})
