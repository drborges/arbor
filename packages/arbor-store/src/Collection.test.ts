import Arbor, { ArborNode } from "./Arbor"
import Collection from "./Collection"
import { MissingUUIDError, NotAnArborNodeError } from "./errors"

import type { INode } from "./Arbor"
import { toINode } from "./test.helpers"

interface User {
  uuid: string
  name: string
}

describe("Collection", () => {
  describe("#get", () => {
    it("retrieves an item", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "bcd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const node = store.root.fetch("bcd") as INode<User>

      expect(node.$unwrap()).toBe(user2)
    })

    it("returns undefined when no item is found", () => {
      const store = new Arbor(new Collection<User>())

      const node = store.root.fetch("bcd") as INode<User>

      expect(node).toBeUndefined()
    })
  })

  describe("#push", () => {
    it("pushes a new item into the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "bcd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1))

      const newUser = store.root.push(user2) as INode<User>
      const userById = store.root.fetch("bcd")

      expect(newUser).toBe(userById)
      expect(newUser.$unwrap()).toBe(user2)
    })

    it("throws an error when adding a new item without an id", () => {
      const store = new Arbor(new Collection<User>())

      expect(() =>
        store.root.push({ uuid: undefined, name: "Bob" })
      ).toThrowError(MissingUUIDError)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const collection = new Collection<User>()

      expect(() =>
        collection.push({ uuid: undefined, name: "Bob" })
      ).toThrowError(NotAnArborNodeError)
    })

    it("pushes many items into the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "bcd", name: "Alice" }
      const store = new Arbor(new Collection<User>())

      const newUsers = store.root.push(user1, user2)
      const user1ById = store.root.fetch("abc")
      const user2ById = store.root.fetch("bcd")
      const newUser1 = newUsers[0] as INode<User>
      const newUser2 = newUsers[1] as INode<User>

      expect(newUser1).toBe(user1ById)
      expect(newUser2).toBe(user2ById)
      expect(newUser1.$unwrap()).toBe(user1)
      expect(newUser2.$unwrap()).toBe(user2)
    })
  })

  describe("#merge", () => {
    it("merges new data into a given collection item", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>(user1))

      const item1 = store.root.fetch("abc")

      store.root.merge(item1, { name: "Bob Updated" })

      expect(user1).toEqual({ uuid: "abc", name: "Bob" })
      expect(store.root.fetch("abc")).toEqual({
        uuid: "abc",
        name: "Bob Updated",
      })
    })

    it("merges new data into a given collection item by its id", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>(user1))

      store.root.merge("abc", { name: "Bob Updated" })

      expect(user1).toEqual({ uuid: "abc", name: "Bob" })
      expect(store.root.fetch("abc")).toEqual({
        uuid: "abc",
        name: "Bob Updated",
      })
    })

    it("does not override the id property", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>(user1))

      const item1 = store.root.fetch("abc")

      store.root.merge(item1, { name: "Bob Updated", uuid: "to be ignored" })

      expect(user1).toEqual({ uuid: "abc", name: "Bob" })
      expect(store.root.fetch("abc")).toEqual({
        uuid: "abc",
        name: "Bob Updated",
      })
    })

    it("returns undefined when item is not found", () => {
      const user = { uuid: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>())

      const updatedItem = store.root.merge(user, { name: "Bob Updated" })

      expect(updatedItem).toBeUndefined()
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const collection = new Collection<User>()

      expect(() =>
        collection.merge({ uuid: undefined, name: "Bob" }, {})
      ).toThrowError(NotAnArborNodeError)
    })
  })

  describe("#mergeBy", () => {
    it("merges new data into items within a collection matching a given predicate", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const originalBob = store.root.fetch("abc")
      const originalAlice = store.root.fetch("abd")
      const originalBarbara = store.root.fetch("abe")
      const updatedItems = store.root.mergeBy(
        (user) => user.name.startsWith("B"),
        (user) => ({ name: `${user.name} Updated` })
      )

      const alice = store.root.fetch("abd")
      const bob = updatedItems[0] as INode<User>
      const barbara = updatedItems[1] as INode<User>

      expect(updatedItems.length).toBe(2)
      expect(bob).toEqual({ uuid: "abc", name: "Bob Updated" })
      expect(barbara).toEqual({ uuid: "abe", name: "Barbara Updated" })
      expect(bob).not.toBe(originalBob)
      expect(barbara).not.toBe(originalBarbara)
      expect(alice).toBe(originalAlice)
      expect(store.root).toEqual({
        abc: {
          uuid: "abc",
          name: "Bob Updated",
        },
        abd: {
          uuid: "abd",
          name: "Alice",
        },
        abe: {
          uuid: "abe",
          name: "Barbara Updated",
        },
      })
    })

    it("does not update any item when no items match the predicate", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const originalBob = store.root.fetch("abc")
      const originalAlice = store.root.fetch("abd")
      const originalBarbara = store.root.fetch("abe")

      const updatedItems = store.root.mergeBy(
        (user) => user.name.startsWith("Z"),
        (user) => ({ name: `${user.name} Updated` })
      )

      expect(updatedItems.length).toBe(0)
      expect(store.root.fetch("abc")).toBe(originalBob)
      expect(store.root.fetch("abd")).toBe(originalAlice)
      expect(store.root.fetch("abe")).toBe(originalBarbara)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const collection = new Collection<User>()

      expect(() =>
        collection.mergeBy(
          () => true,
          () => ({})
        )
      ).toThrowError(NotAnArborNodeError)
    })
  })

  describe("#map", () => {
    it("maps over all items in the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const ids = store.root.map((user) => user.uuid)

      expect(ids).toEqual(["abc", "abd", "abe"])
    })

    it("generates an empty array when there are no items in the collection", () => {
      const store = new Arbor(new Collection<User>())

      const ids = store.root.map((user) => user.uuid)

      expect(ids).toEqual([])
    })
  })

  describe("#forEach", () => {
    it("allows iterating over each element within the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))
      const users: User[] = []

      store.root.forEach((user) => {
        users.push(user)
      })

      expect(users[0]).toBe(store.root.fetch("abc"))
      expect(users[1]).toBe(store.root.fetch("abd"))
      expect(users[2]).toBe(store.root.fetch("abe"))
    })
  })

  describe("#filter", () => {
    it("filter items from a collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))
      const bob = store.root.fetch("abc")
      const barbara = store.root.fetch("abe")

      const users = store.root.filter((user) => user.name.startsWith("B"))

      expect(users.length).toBe(2)
      expect(users[0]).toBe(bob)
      expect(users[1]).toBe(barbara)
    })

    it("returns an empty array if no item matches the filter predicate", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const users = store.root.filter((user) => user.name.startsWith("C"))

      expect(users.length).toBe(0)
    })
  })

  describe("#find", () => {
    it("finds the first item matching the given predicate", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const user = store.root.find((u) => u.name.startsWith("B")) as INode<User>

      expect(user.$unwrap()).toBe(user1)
    })

    it("returns undefined if no item is found", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const user = store.root.find((u) => u.name.startsWith("C")) as INode<User>

      expect(user).toBe(undefined)
    })
  })

  describe("#fetch", () => {
    it("fetch an item by its id from within the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const bob = store.root.fetch("abc") as INode<User>
      const alice = store.root.fetch("abd") as INode<User>

      expect(bob.$unwrap()).toBe(user1)
      expect(alice.$unwrap()).toBe(user2)
    })

    it("fetch an item by an object that implements the Record interface", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const bob = store.root.fetch(user1) as INode<User>
      const alice = store.root.fetch(user2) as INode<User>

      expect(bob.$unwrap()).toBe(user1)
      expect(alice.$unwrap()).toBe(user2)
    })

    it("returns undefined if no item is found", () => {
      const store = new Arbor(new Collection<User>())

      const user = store.root.fetch("abc") as INode<User>

      expect(user).toBeUndefined()
    })

    it("fetches the item even when the collection is not bound to an Arbor store", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const collection = new Collection<User>(user1, user2)

      expect(collection.fetch("abc")).toBe(user1)
      expect(collection.fetch("abd")).toBe(user2)
    })
  })

  describe("#length", () => {
    it("returns the number of items in the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.length).toBe(2)
    })

    it("returns zero if the collection is empty", () => {
      const store = new Arbor(new Collection<User>())

      expect(store.root.length).toBe(0)
    })
  })

  describe("#includes", () => {
    it("checks if a given item is included in the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.includes(user1)).toBe(true)
      expect(store.root.includes(user2)).toBe(true)

      store.root.delete(store.root.fetch("abd"))

      expect(store.root.includes(user2)).toBe(false)
    })

    it("checks if a given id is included in the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.includes("abc")).toBe(true)
      expect(store.root.includes("abd")).toBe(true)

      store.root.delete(store.root.fetch("abd"))

      expect(store.root.includes("abd")).toBe(false)
    })
  })

  describe("#some", () => {
    it("checks if there's at least one item in the collection matching the given predicate", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.some((user) => user.name.startsWith("B"))).toBe(true)
      expect(store.root.some((user) => user.name.startsWith("Z"))).toBe(false)
    })
  })

  describe("#every", () => {
    it("checks if all items in the collection match the given predicate", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.every((user) => user.name.length > 2)).toBe(true)
      expect(store.root.every((user) => user.name.length > 3)).toBe(false)
    })
  })

  describe("#sort", () => {
    it("retrieves and sorts all collection items by a given compare function", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))
      const byName = (u1: User, u2: User) => u1.name.localeCompare(u2.name)

      const sorted = store.root.sort(byName)

      expect(sorted).toEqual([user2, user1])
      expect(sorted[0]).toBe(store.root.fetch("abd"))
      expect(sorted[1]).toBe(store.root.fetch("abc"))
    })
  })

  describe("#slice", () => {
    it("returns a slice of the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const slice = store.root.slice(1, 4)

      expect(slice).toEqual([user2, user3])
      expect(slice[0]).toBe(store.root.fetch("abd"))
      expect(slice[1]).toBe(store.root.fetch("abe"))
    })

    it("returns an empty array when no items intersect the given index range", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const slice = store.root.slice(3, 4)

      expect(slice).toEqual([])
    })
  })

  describe("#delete", () => {
    it("deletes an item from the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const deleted = store.root.delete(store.root.fetch("abd")) as INode<User>

      expect(deleted).toBe(user2)
      expect(store.root.fetch("abd")).toBeUndefined()
    })

    it("deletes an item from the collection by its id", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const deleted = store.root.delete("abd") as INode<User>

      expect(deleted).toBe(user2)
      expect(store.root.fetch("abd")).toBeUndefined()
    })

    it("returns undefined if item no longer exists in the state tree", () => {
      const store = new Arbor(
        new Collection<User>({ uuid: "abc", name: "Bob" })
      )
      const user = store.root.fetch("abc")

      store.root.delete(user)
      const deleted = store.root.delete(user)

      expect(deleted).toBeUndefined()
    })

    it("allows deleting items that are not Arbor nodes", () => {
      const user = { uuid: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>(user))

      const deleted = store.root.delete(user) as INode<User>

      expect(deleted).toBe(user)
      expect(store.root.fetch("abc")).toBeUndefined()
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const collection = new Collection<User>()

      expect(() => collection.delete("some uuid")).toThrowError(
        NotAnArborNodeError
      )
    })
  })

  describe("#deleteBy", () => {
    it("deletes all items matching a given predicate", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const deleted = store.root.deleteBy((user) => user.name.startsWith("B"))

      expect(deleted.length).toBe(2)
      expect(deleted[0]).toBe(user1)
      expect(deleted[1]).toBe(user3)
      expect(store.root.fetch("abc")).toBeUndefined()
      expect(store.root.fetch("abe")).toBeUndefined()
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const collection = new Collection<User>()

      expect(() => collection.deleteBy(() => true)).toThrowError(
        NotAnArborNodeError
      )
    })
  })

  describe("#clear", () => {
    it("deletes all items from the collection", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      store.root.clear()

      expect(store.root.length).toBe(0)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const collection = new Collection<User>()

      expect(() => collection.clear()).toThrowError(NotAnArborNodeError)
    })
  })

  describe("$clone", () => {
    it("shallowly clones the collection into a new one", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const store = new Arbor(new Collection<ArborNode<User>>(user1, user2))
      const cloned = toINode(store.root).$clone()

      expect(cloned).toBeInstanceOf(Collection)
      expect(cloned).not.toBe(toINode(store.root).$unwrap())
      expect(cloned.length).toBe(2)
      expect(toINode(cloned.fetch("abc")).$unwrap()).toBe(user1)
      expect(toINode(cloned.fetch("abd")).$unwrap()).toBe(user2)
      expect(cloned.fetch("abc")).toBe(store.root.fetch("abc"))
      expect(cloned.fetch("abd")).toBe(store.root.fetch("abd"))
    })
  })

  describe("iterator support", () => {
    it("can be destructed", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const [head, ...tail] = store.root

      expect(head).toBe(store.root.fetch("abc"))
      expect(tail.length).toBe(2)
      expect(tail[0]).toBe(store.root.fetch("abd"))
      expect(tail[1]).toBe(store.root.fetch("abe"))
    })

    it("can be iterated over with for ... of", () => {
      const user1 = { uuid: "abc", name: "Bob" }
      const user2 = { uuid: "abd", name: "Alice" }
      const user3 = { uuid: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))
      const users: User[] = []

      for (const user of store.root) {
        users.push(user)
      }

      expect(users[0]).toBe(store.root.fetch("abc"))
      expect(users[1]).toBe(store.root.fetch("abd"))
      expect(users[2]).toBe(store.root.fetch("abe"))
    })
  })
})
