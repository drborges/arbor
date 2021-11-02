import Arbor, { Node } from "@arborjs/store"

import Repository, { IRepository, Record } from "./Repository"

interface User {
  id?: string
  name: string
  active?: boolean
}

const createNextId =
  (id = 0) =>
  () =>
    `${id++}`

describe("Repository", () => {
  describe("initialization", () => {
    it("initializes the repository with an existing store instance", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      expect(repository.store).toBe(store)
    })

    it("initializes the repository with an initial store value", () => {
      const initialValue = {
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      }

      const repository = new Repository(initialValue)

      expect(repository.store.root).toEqual(initialValue)
    })
  })

  describe("#all", () => {
    it("retrieves all items from the repository", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const users = repository.all

      expect(users[0]).toBe(store.root["1"])
      expect(users[1]).toBe(store.root["2"])
    })
  })

  describe("#clear", () => {
    it("clears up the repository", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)

      repository.clear()

      expect(store.root).toEqual({})
    })
  })

  describe("#create", () => {
    it("creates an object in the repository", () => {
      const store = new Arbor<IRepository<User>>()
      const repository = new Repository(store)

      const user = repository.create({ name: "Bob" })

      expect(user).toBe(store.root[user.id])
    })

    it("creates an object in the repository with a custom uuid function", () => {
      const store = new Arbor<IRepository<User>>()
      const repository = new Repository(store, createNextId(2))

      const user = repository.create({ name: "Bob" })

      expect(user).toBe(store.root["2"])
    })

    it("triggers an 'onCreate' event", () => {
      const nextId = createNextId(3)
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store, nextId)
      repository.onCreate = jest.fn(repository.onCreate)
      repository.create({ name: "Aline" })

      expect(repository.onCreate).toHaveBeenCalledWith("3")
    })
  })

  describe("#createMany", () => {
    it("creates many objects in the repository", () => {
      const store = new Arbor<IRepository<User>>()
      const repository = new Repository(store)

      const users = repository.createMany({ name: "Bob" }, { name: "Alice" })

      expect(users[0]).toBe(store.root[users[0].id])
      expect(users[1]).toBe(store.root[users[1].id])
    })

    it("triggers a single mutation in the underlying store", () => {
      const store = new Arbor<IRepository<User>>()
      store.notify = jest.fn(store.notify)
      const repository = new Repository(store)

      repository.createMany({ name: "Bob" }, { name: "Alice" })

      expect(store.notify).toHaveBeenNthCalledWith(1, store.root, {})
    })

    it("triggers an 'onCreate' event", () => {
      const nextId = createNextId(3)
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store, nextId)
      repository.onCreate = jest.fn(repository.onCreate)
      repository.createMany({ name: "Aline" }, { name: "Lucy" })

      expect(repository.onCreate).toHaveBeenCalledWith("3")
      expect(repository.onCreate).toHaveBeenCalledWith("4")
    })
  })

  describe("#delete", () => {
    it("deletes an object from the repository", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const userToDelete = store.root["2"] as Node<Record<User>>
      const user = repository.delete(userToDelete)

      expect(user).toBe(userToDelete.$unwrap())
      expect(store.root[user.id]).toBeUndefined()
    })

    it("deletes an object from the repository by its id", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const userToDelete = store.root["2"] as Node<User>
      const user = repository.delete("2")

      expect(user).toBe(userToDelete.$unwrap())
      expect(store.root[user.id]).toBeUndefined()
    })

    it("triggers an 'onDelete' event", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)
      repository.onDelete = jest.fn(repository.onDelete)
      repository.delete("2")

      expect(repository.onDelete).toHaveBeenNthCalledWith(1, "2")
    })
  })

  describe("#deleteBy", () => {
    it("deletes objects from the repository matched by a predicate function", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)

      const alice = store.root["2"] as Node<User>
      const aline = store.root["3"] as Node<User>
      const deletedUsers = repository.deleteBy((user) =>
        user.name.startsWith("Ali")
      )

      expect(deletedUsers[0]).toBe(alice.$unwrap())
      expect(deletedUsers[1]).toBe(aline.$unwrap())
      expect(store.root[alice.id]).toBeUndefined()
      expect(store.root[aline.id]).toBeUndefined()
    })

    it("triggers a single mutation in the underlying store", () => {
      const initialValue = {
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      }

      const store = new Arbor<IRepository<User>>(initialValue)

      store.notify = jest.fn(store.notify)
      const repository = new Repository(store)
      repository.deleteBy((user) => user.name.startsWith("Ali"))

      expect(store.notify).toHaveBeenNthCalledWith(1, store.root, initialValue)
    })

    it("triggers an 'onDelete' event", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)
      repository.onDelete = jest.fn(repository.onDelete)
      repository.deleteBy((user) => user.name.startsWith("Ali"))

      expect(repository.onDelete).toHaveBeenCalledWith("2")
      expect(repository.onDelete).toHaveBeenCalledWith("3")
    })
  })

  describe("#duplicate", () => {
    it("duplicates an object by its id within the repository", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const alice1 = store.root["2"] as Node<User>
      const alice2 = repository.duplicate(alice1.id)

      expect(store.root[alice1.id]).toBeDefined()
      expect(store.root[alice2.id]).toBeDefined()
      expect(alice1).not.toBe(alice2)
      expect(alice2.name).toEqual("Alice")
    })

    it("duplicates an object within the repository", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const alice1 = store.root["2"] as Node<Record<User>>
      const alice2 = repository.duplicate(alice1)

      expect(store.root[alice1.id]).toBeDefined()
      expect(store.root[alice2.id]).toBeDefined()
      expect(alice1).not.toBe(alice2)
      expect(alice2.name).toEqual("Alice")
    })

    it("triggers an 'onDuplicate' event", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)
      repository.onDuplicate = jest.fn(repository.onDuplicate)
      repository.duplicate("2")

      expect(repository.onDuplicate).toHaveBeenCalledWith("2")
    })
  })

  describe("#duplicateBy", () => {
    it("duplicates objects matching the given predicate", () => {
      const nextId = createNextId(4)

      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store, nextId)

      const alice1 = store.root["2"] as Node<User>
      const aline1 = store.root["3"] as Node<User>

      const duplicatedUsers = repository.duplicateBy((user) =>
        user.name.startsWith("Ali")
      )

      const alice2 = store.root["4"]
      const aline2 = store.root["5"]

      expect(alice2).toBe(duplicatedUsers[0])
      expect(aline2).toBe(duplicatedUsers[1])
      expect(alice1).not.toBe(alice2)
      expect(aline1).not.toBe(aline2)
      expect(alice2.name).toEqual("Alice")
      expect(aline2.name).toEqual("Aline")
    })

    it("duplicates objects matching the given predicate while overriding specific fields", () => {
      const nextId = createNextId(4)

      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store, nextId)

      const alice1 = store.root["2"] as Node<User>
      const aline1 = store.root["3"] as Node<User>

      const duplicatedUsers = repository.duplicateBy(
        (user) => user.name.startsWith("Ali"),
        { name: "updated" }
      )

      const alice2 = store.root["4"]
      const aline2 = store.root["5"]

      expect(alice2).toBe(duplicatedUsers[0])
      expect(aline2).toBe(duplicatedUsers[1])
      expect(alice1).not.toBe(alice2)
      expect(aline1).not.toBe(aline2)
      expect(alice2.name).toEqual("updated")
      expect(aline2.name).toEqual("updated")
    })

    it("duplicates objects matching the given predicate while overriding specific fields through an update function", () => {
      const nextId = createNextId(4)

      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store, nextId)

      const alice1 = store.root["2"] as Node<User>
      const aline1 = store.root["3"] as Node<User>

      const duplicatedUsers = repository.duplicateBy(
        (user) => user.name.startsWith("Ali"),
        (user) => ({ name: `${user.name} 2` })
      )

      const alice2 = store.root["4"]
      const aline2 = store.root["5"]

      expect(alice2).toBe(duplicatedUsers[0])
      expect(aline2).toBe(duplicatedUsers[1])
      expect(alice1).not.toBe(alice2)
      expect(aline1).not.toBe(aline2)
      expect(alice2.name).toEqual("Alice 2")
      expect(aline2.name).toEqual("Aline 2")
    })

    it("triggers a single mutation in the underlying store", () => {
      const initialValue = {
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      }

      const store = new Arbor<IRepository<User>>(initialValue)

      store.notify = jest.fn(store.notify)
      const repository = new Repository(store)
      repository.duplicateBy((user) => user.name.startsWith("Ali"))

      expect(store.notify).toHaveBeenNthCalledWith(1, store.root, initialValue)
    })

    it("triggers an 'onDuplicate' event", () => {
      const nextId = createNextId(4)
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store, nextId)
      repository.onDuplicate = jest.fn(repository.onDuplicate)
      repository.duplicateBy((user) => user.name.startsWith("Ali"))

      expect(repository.onDuplicate).toHaveBeenCalledWith("2")
      expect(repository.onDuplicate).toHaveBeenCalledWith("3")
    })
  })

  describe("#get", () => {
    it("returns 'undefined' when no item is found", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const user = repository.get("3")

      expect(user).toBeUndefined()
    })

    it("retrieves a record from the repository by its id", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const user = repository.get("2")

      expect(user).toBe(store.root["2"])
    })
  })

  describe("#getBy", () => {
    it("returns an empty array when no item is matched", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)

      const retrievedUsers = repository.getBy((user) =>
        user.name.startsWith("C")
      )

      expect(retrievedUsers).toEqual([])
    })

    it("retrieves all records from the repository matching the given predicate", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)

      const retrievedUsers = repository.getBy((user) =>
        user.name.startsWith("Ali")
      )

      expect(store.root["2"]).toBe(retrievedUsers[0])
      expect(store.root["3"]).toBe(retrievedUsers[1])
    })
  })

  describe("#update", () => {
    it("updates an existing object within the repository", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const alice = store.root["2"] as Node<Record<User>>
      const updatedUser = repository.update(alice, { name: "Aline" })

      expect(updatedUser.id).toBe(alice.id)
      expect(updatedUser.name).toBe("Aline")
    })

    it("updates an existing object within the repository by its id", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const alice = store.root["2"] as Node<User>
      const updatedUser = repository.update(alice.id, { name: "Aline" })

      expect(updatedUser.id).toBe(alice.id)
      expect(updatedUser.name).toBe("Aline")
    })

    it("updates an existing object within the repository through an update function", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
      })

      const repository = new Repository(store)

      const alice = store.root["2"] as Node<User>
      const updatedUser = repository.update(alice.id, (user) => ({
        ...user,
        name: "Aline",
      }))

      expect(updatedUser.id).toBe(alice.id)
      expect(updatedUser.name).toBe("Aline")
    })

    it("triggers an 'onUpdate' event", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)
      repository.onUpdate = jest.fn(repository.onUpdate)
      repository.update("2", { name: "updated" })

      expect(repository.onUpdate).toHaveBeenCalledWith("2")
    })
  })

  describe("#updateBy", () => {
    it("updates existing objects within the repository matching the predicate", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)

      const alice = store.root["2"] as Node<User>
      const aline = store.root["3"] as Node<User>
      const updatedUsers = repository.updateBy(
        (user) => user.name.startsWith("Ali"),
        { name: "updated" }
      )

      expect(updatedUsers[0].id).toBe(alice.id)
      expect(updatedUsers[0].name).toBe("updated")
      expect(updatedUsers[1].id).toBe(aline.id)
      expect(updatedUsers[1].name).toBe("updated")
    })

    it("updates existing objects within the repository matching the predicate through an update function", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)

      const alice = store.root["2"] as Node<User>
      const aline = store.root["3"] as Node<User>
      const updatedUsers = repository.updateBy(
        (user) => user.name.startsWith("Ali"),
        (user) => ({ ...user, name: "updated" })
      )

      expect(updatedUsers[0].id).toBe(alice.id)
      expect(updatedUsers[0].name).toBe("updated")
      expect(updatedUsers[1].id).toBe(aline.id)
      expect(updatedUsers[1].name).toBe("updated")
    })

    it("triggers a single mutation in the underlying store", () => {
      const initialValue = {
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      }

      const store = new Arbor<IRepository<User>>(initialValue)

      store.notify = jest.fn(store.notify)
      const repository = new Repository(store)
      repository.updateBy((user) => user.name.startsWith("Ali"), {
        name: "updated",
      })

      expect(store.notify).toHaveBeenNthCalledWith(1, store.root, initialValue)
    })

    it("triggers an 'onUpdate' event", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob" },
        "2": { id: "2", name: "Alice" },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)
      repository.onUpdate = jest.fn(repository.onUpdate)
      repository.updateBy((user) => user.name.startsWith("Ali"), {
        name: "updated",
      })

      expect(repository.onUpdate).toHaveBeenCalledWith("2")
      expect(repository.onUpdate).toHaveBeenCalledWith("3")
    })
  })

  describe("#where", () => {
    it("returns an empty array when the store is empty", () => {
      const store = new Arbor<IRepository<User>>()

      const repository = new Repository(store)
      const users = repository.where({ active: true })

      expect(users).toEqual([])
    })

    it("allows selecting items by their fields", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob", active: true },
        "2": { id: "2", name: "Alice", active: true },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)
      const users = repository.where({ active: true })

      expect(users[0]).toBe(store.root["1"])
      expect(users[1]).toBe(store.root["2"])
    })

    it("returns an empty array when no item is selected", () => {
      const store = new Arbor<IRepository<User>>({
        "1": { id: "1", name: "Bob", active: true },
        "2": { id: "2", name: "Alice", active: true },
        "3": { id: "3", name: "Aline" },
      })

      const repository = new Repository(store)
      const users = repository.where({ id: "4" })

      expect(users).toEqual([])
    })
  })
})
