import Arbor, { ArborNode, INode, Proxiable } from "./Arbor"
import Repository from "./Repository"

@Proxiable()
class User {
  uuid: string
  name: string
  age: number

  constructor(data: Partial<User>) {
    Object.assign(this, data)
  }
}

describe("Repository", () => {
  it("adds a new item to the repository", () => {
    const store = new Arbor(new Repository<User>())
    const user = new User({ uuid: "123", name: "Alice", age: 22 })

    store.state["123"] = user

    const node = store.state["123"] as INode<User>

    expect(node.$unwrap()).toBe(user)
  })

  it("initializes the repository with items", () => {
    const user1 = new User({ uuid: "1", name: "Alice", age: 22 })
    const user2 = new User({ uuid: "2", name: "Bob", age: 25 })
    const store = new Arbor(new Repository(user1, user2))

    expect(store.state).toEqual({
      "1": user1,
      "2": user2,
    })
  })

  it("deletes an item from the repository", () => {
    const user1 = new User({ uuid: "1", name: "Alice", age: 22 })
    const user2 = new User({ uuid: "2", name: "Bob", age: 25 })
    const store = new Arbor(new Repository(user1, user2))

    delete store.state[user1.uuid]

    expect(store.state).toEqual({
      "2": user2,
    })
  })

  it("implements an iterator for the values stored in the repository", () => {
    const items: ArborNode<User>[] = []
    const user1 = new User({ uuid: "1", name: "Alice", age: 22 })
    const user2 = new User({ uuid: "2", name: "Bob", age: 25 })
    const store = new Arbor(new Repository(user1, user2))

    for (const item of store.state) {
      items.push(item)
    }

    expect(items[0]).toBe(store.state["1"])
    expect(items[1]).toBe(store.state["2"])
    expect(items).toEqual([user1, user2])
  })

  it("destructs repository into an array ordered by the items' insertion order", () => {
    const store = new Arbor(
      new Repository(
        new User({ uuid: "c", name: "User 1" }),
        new User({ uuid: "b", name: "User 2" }),
        new User({ uuid: "a", name: "User 3" })
      )
    )

    const user1 = store.state.c
    const user2 = store.state.b
    const user3 = store.state.a

    const [...users] = store.state

    expect(users[0]).toBe(user1)
    expect(users[1]).toBe(user2)
    expect(users[2]).toBe(user3)
  })
})
