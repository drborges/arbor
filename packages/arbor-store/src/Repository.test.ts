import Arbor, { ArborNode, INode } from "./Arbor"
import Repository from "./Repository"
import BaseNode from "./BaseNode"

class User extends BaseNode<User> {
  uuid: string
  name: string
  age: number
}

describe("Repository", () => {
  it("allows adding new items to the repository", () => {
    const store = new Arbor(new Repository<User>())
    const user = User.from<User>({ uuid: "123", name: "Alice", age: 22 })

    store.root["123"] = user

    const node = store.root["123"] as INode<User>

    expect(node.$unwrap()).toEqual(user)
    expect(node.$unwrap()).not.toBe(user)
  })

  it("initializes the repository with items", () => {
    const user1 = User.from<User>({ uuid: "1", name: "Alice", age: 22 })
    const user2 = User.from<User>({ uuid: "2", name: "Bob", age: 25 })
    const store = new Arbor(new Repository<User>(user1, user2))

    expect(store.root).toEqual({
      "1": user1,
      "2": user2,
    })
  })

  it("allows deleting items from the repository", () => {
    const user1 = User.from<User>({ uuid: "1", name: "Alice", age: 22 })
    const user2 = User.from<User>({ uuid: "2", name: "Bob", age: 25 })
    const store = new Arbor(new Repository<User>(user1, user2))

    delete store.root[user1.uuid]

    expect(store.root).toEqual({
      "2": user2
    })
  })

  it("implements an iterator for the values stored in the repository", () => {
    const items: ArborNode<User>[] = []
    const user1 = User.from<User>({ uuid: "1", name: "Alice", age: 22 })
    const user2 = User.from<User>({ uuid: "2", name: "Bob", age: 25 })
    const store = new Arbor(new Repository<User>(user1, user2))

    for (const item of store.root) {
      items.push(item)
    }

    expect(items[0]).toBe(store.root["1"])
    expect(items[1]).toBe(store.root["2"])
    expect(items).toEqual([
      user1,
      user2,
    ])
  })
})
