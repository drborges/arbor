import Arbor from "./Arbor"
import Collection from "./Collection"

import type { Node } from "./types"

interface User {
  id: string
  name: string
}

describe("Collection", () => {
  describe("#get", () => {
    it("retrieves an item", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "bcd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const node = store.root.fetch("bcd") as Node<User>

      expect(node.$unwrap()).toBe(user2)
    })

    it("returns undefined when no item is found", () => {
      const store = new Arbor(new Collection<User>())

      const node = store.root.fetch("bcd") as Node<User>

      expect(node).toBeUndefined()
    })
  })

  describe("#add", () => {
    it("add a new item into the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "bcd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1))

      const newUser = store.root.add(user2) as Node<User>
      const userById = store.root.fetch("bcd")

      expect(newUser).toBe(userById)
      expect(newUser.$unwrap()).toBe(user2)
    })

    it("throws an error when adding a new item without an id", () => {
      const store = new Arbor(new Collection<User>())

      expect(() => store.root.add({ id: undefined, name: "Bob" })).toThrowError(
        "Collection items must have a string id"
      )
    })
  })

  describe("#addMany", () => {
    it("add many items into the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "bcd", name: "Alice" }
      const store = new Arbor(new Collection<User>())

      const newUsers = store.root.addMany(user1, user2)
      const user1ById = store.root.fetch("abc")
      const user2ById = store.root.fetch("bcd")
      const newUser1 = newUsers[0] as Node<User>
      const newUser2 = newUsers[1] as Node<User>

      expect(newUser1).toBe(user1ById)
      expect(newUser2).toBe(user2ById)
      expect(newUser1.$unwrap()).toBe(user1)
      expect(newUser2.$unwrap()).toBe(user2)
    })

    it("throws an error when adding a new item without an id", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: undefined, name: "Alice" }
      const store = new Arbor(new Collection<User>())

      expect(() => store.root.addMany(user1, user2)).toThrowError(
        "Collection items must have a string id"
      )

      expect(store.root.length).toBe(0)
    })
  })

  describe("#merge", () => {
    it("merges new data into a given collection item", () => {
      const user1 = { id: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>(user1))

      const item1 = store.root.fetch("abc")

      store.root.merge(item1, { name: "Bob Updated" })

      expect(user1).toEqual({ id: "abc", name: "Bob" })
      expect(store.root.fetch("abc")).toEqual({
        id: "abc",
        name: "Bob Updated",
      })
    })

    it("does not override the id property", () => {
      const user1 = { id: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>(user1))

      const item1 = store.root.fetch("abc")

      store.root.merge(item1, { name: "Bob Updated", id: "to be ignored" })

      expect(user1).toEqual({ id: "abc", name: "Bob" })
      expect(store.root.fetch("abc")).toEqual({
        id: "abc",
        name: "Bob Updated",
      })
    })

    it("returns undefined when item is not found", () => {
      const user = { id: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>())

      const updatedItem = store.root.merge(user, { name: "Bob Updated" })

      expect(updatedItem).toBeUndefined()
    })
  })

  describe("#mergeBy", () => {
    it("merges new data into items within a collection matching a given predicate", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const originalBob = store.root.fetch("abc")
      const originalAlice = store.root.fetch("abd")
      const originalBarbara = store.root.fetch("abe")
      const updatedItems = store.root.mergeBy(
        (user) => user.name.startsWith("B"),
        (user) => ({ name: `${user.name} Updated` })
      )

      const alice = store.root.fetch("abd")
      const bob = updatedItems[0] as Node<User>
      const barbara = updatedItems[1] as Node<User>

      expect(updatedItems.length).toBe(2)
      expect(bob).toEqual({ id: "abc", name: "Bob Updated" })
      expect(barbara).toEqual({ id: "abe", name: "Barbara Updated" })
      expect(bob).not.toBe(originalBob)
      expect(barbara).not.toBe(originalBarbara)
      expect(alice).toBe(originalAlice)
      expect(store.root).toEqual({
        abc: {
          id: "abc",
          name: "Bob Updated",
        },
        abd: {
          id: "abd",
          name: "Alice",
        },
        abe: {
          id: "abe",
          name: "Barbara Updated",
        },
      })
    })

    it("does not update any item when no items match the predicate", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
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
  })

  describe("#map", () => {
    it("maps over all items in the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const ids = store.root.map((user) => user.id)

      expect(ids).toEqual(["abc", "abd", "abe"])
    })
  })

  describe("#filter", () => {
    it("filter items from a collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))
      const bob = store.root.fetch("abc")
      const barbara = store.root.fetch("abe")

      const users = store.root.filter((user) => user.name.startsWith("B"))

      expect(users.length).toBe(2)
      expect(users[0]).toBe(bob)
      expect(users[1]).toBe(barbara)
    })
  })

  describe("#find", () => {
    it("finds the first item matching the given predicate", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const user = store.root.find((u) => u.name.startsWith("B")) as Node<User>

      expect(user.$unwrap()).toBe(user1)
    })
  })

  describe("#fetch", () => {
    it("fetch an item by its id from within the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const bob = store.root.fetch("abc") as Node<User>
      const alice = store.root.fetch("abd") as Node<User>

      expect(bob.$unwrap()).toBe(user1)
      expect(alice.$unwrap()).toBe(user2)
    })

    it("returns undefined if no item is found", () => {
      const store = new Arbor(new Collection<User>())

      const user = store.root.fetch("abc") as Node<User>

      expect(user).toBeUndefined()
    })
  })

  describe("#reload", () => {
    it("reloads a stale state tree node reference", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const bob = store.root.fetch("abc") as Node<User>

      bob.name = "Bob Updated"

      expect(bob.name).toEqual("Bob")

      const reloadedBob = store.root.reload(bob)

      expect(reloadedBob.name).toEqual("Bob Updated")
    })

    it("reloads the Arbor node using a non Arbor node reference", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))
      const node = store.root.fetch("abc")

      const reloaded = store.root.reload(user1)

      expect(reloaded).toBe(node)
    })

    it("returns undefined if the item is no longer part of the state tree", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const bob = store.root.fetch("abc")
      store.root.delete(bob)

      const reloaded = store.root.reload(bob)

      expect(reloaded).toBeUndefined()
    })
  })

  describe("#values", () => {
    it("returns an array containing all items in the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const users = store.root.values
      const bob = users[0] as Node<User>
      const alice = users[1] as Node<User>

      expect(users.length).toBe(2)
      expect(bob.$unwrap()).toBe(user1)
      expect(alice.$unwrap()).toBe(user2)
    })

    it("returns an empty array when there are no items in the collection", () => {
      const store = new Arbor(new Collection<User>())

      const users = store.root.values

      expect(users).toEqual([])
    })
  })

  describe("#ids", () => {
    it("returns an array containing all ids of all items in the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const ids = store.root.ids

      expect(ids.length).toBe(2)
      expect(ids[0]).toBe("abc")
      expect(ids[1]).toBe("abd")
    })

    it("returns an empty array when there are no items in the collection", () => {
      const store = new Arbor(new Collection<User>())

      const ids = store.root.ids

      expect(ids).toEqual([])
    })
  })

  describe("#first", () => {
    // The order of items is based on the insertion order. This is only valid if the item ids are non numeric-like
    it("fetches the first item in the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const user = store.root.first as Node<User>

      expect(user.$unwrap()).toBe(user1)
    })

    it("returns undefined if the collection is empty", () => {
      const store = new Arbor(new Collection<User>())

      const user = store.root.first

      expect(user).toBeUndefined()
    })
  })

  describe("#last", () => {
    // The order of items is based on the insertion order. This is only valid if the item ids are non numeric-like
    it("fetches the last item in the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const user = store.root.last as Node<User>

      expect(user.$unwrap()).toBe(user2)
    })

    it("returns undefined if the collection is empty", () => {
      const store = new Arbor(new Collection<User>())

      const user = store.root.last

      expect(user).toBeUndefined()
    })
  })

  describe("#length", () => {
    it("returns the number of items in the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.length).toBe(2)
    })

    it("returns zero if the collection is empty", () => {
      const store = new Arbor(new Collection<User>())

      expect(store.root.length).toBe(0)
    })
  })

  describe("#includes", () => {
    it("checks if a given item is included in the collection by matching ids", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.includes(user1)).toBe(true)
      expect(store.root.includes(user2)).toBe(true)

      store.root.delete(store.root.fetch("abd"))

      expect(store.root.includes(user2)).toBe(false)
    })
  })

  describe("#some", () => {
    it("checks if there's at least one item in the collection matching the given predicate", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.some((user) => user.name.startsWith("B"))).toBe(true)
      expect(store.root.some((user) => user.name.startsWith("Z"))).toBe(false)
    })
  })

  describe("#every", () => {
    it("checks if all items in the collection match the given predicate", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      expect(store.root.every((user) => user.name.length > 2)).toBe(true)
      expect(store.root.every((user) => user.name.length > 3)).toBe(false)
    })
  })

  describe("#sort", () => {
    it("retrieves and sorts all collection items by a given compare function", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
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
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const slice = store.root.slice(1, 4)

      expect(slice).toEqual([user2, user3])
      expect(slice[0]).toBe(store.root.fetch("abd"))
      expect(slice[1]).toBe(store.root.fetch("abe"))
    })

    it("returns an empty array when no items intersect the given index range", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const slice = store.root.slice(3, 4)

      expect(slice).toEqual([])
    })
  })

  describe("#delete", () => {
    it("deletes an item from the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const deleted = store.root.delete(store.root.fetch("abd")) as Node<User>

      expect(deleted).toBe(user2)
      expect(store.root.fetch("abd")).toBeUndefined()
    })

    it("returns undefined if item no longer exists in the state tree", () => {
      const store = new Arbor(new Collection<User>({ id: "abc", name: "Bob" }))
      const user = store.root.fetch("abc")

      store.root.delete(user)
      const deleted = store.root.delete(user)

      expect(deleted).toBeUndefined()
    })

    it("allows deleting items that are not Arbor nodes", () => {
      const user = { id: "abc", name: "Bob" }
      const store = new Arbor(new Collection<User>(user))

      const deleted = store.root.delete(user) as Node<User>

      expect(deleted).toBe(user)
      expect(store.root.fetch("abc")).toBeUndefined()
    })
  })

  describe("#deleteBy", () => {
    it("deletes all items matching a given predicate", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const deleted = store.root.deleteBy((user) => user.name.startsWith("B"))

      expect(deleted.length).toBe(2)
      expect(deleted[0]).toBe(user1)
      expect(deleted[1]).toBe(user3)
      expect(store.root.fetch("abc")).toBeUndefined()
      expect(store.root.fetch("abe")).toBeUndefined()
    })
  })

  describe("#clear", () => {
    it("deletes all items from the collection", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      store.root.clear()

      expect(store.root.length).toBe(0)
    })
  })

  describe("$clone", () => {
    it("shallowly clones the collection into a new one", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const store = new Arbor(new Collection<User>(user1, user2))

      const cloned = store.root.$clone()

      expect(cloned).not.toBe(store.root.$unwrap())
      expect(cloned.length).toBe(2)
      expect((cloned.first as Node<User>).$unwrap()).toBe(user1)
      expect((cloned.last as Node<User>).$unwrap()).toBe(user2)
      expect(cloned.first).toBe(store.root.first)
      expect(cloned.last).toBe(store.root.last)
    })
  })

  describe("iterator support", () => {
    it("can be destructed", () => {
      const user1 = { id: "abc", name: "Bob" }
      const user2 = { id: "abd", name: "Alice" }
      const user3 = { id: "abe", name: "Barbara" }
      const store = new Arbor(new Collection<User>(user1, user2, user3))

      const [first, ...tail] = store.root

      expect(first).toBe(store.root.first)
      expect(tail.length).toBe(2)
      expect(tail[0]).toBe(store.root.fetch("abd"))
      expect(tail[1]).toBe(store.root.fetch("abe"))
    })
  })
})
