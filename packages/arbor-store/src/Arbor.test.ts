/* eslint-disable @typescript-eslint/no-unused-expressions */
import Path from "./Path"
import Arbor from "./Arbor"
import Model from "./Model"
import { warmup } from "./test.helpers"

describe("Arbor", () => {
  describe("#root", () => {
    it("retrieves the root node", () => {
      const initialState = {
        users: [{ name: "User 1" }, { name: "User 2" }],
      }
      const store = new Arbor(initialState)

      const node = store.root

      expect(node.$unwrap()).toBe(initialState)
    })
  })

  describe("#setRoot", () => {
    interface IUser {
      name: string
    }

    it("sets a value as the root of the store", () => {
      const initialState = {
        users: [{ name: "User 1" }, { name: "User 2" }],
      }

      const store = new Arbor<{ users: IUser[] }>()
      const node = store.setRoot(initialState)

      const nodeFromCache = store.root

      expect(nodeFromCache).toBe(node)
      expect(nodeFromCache.users[1].name).toEqual("User 2")
    })
  })

  describe("Path walking", () => {
    it("walks a proxied path", () => {
      const store = new Arbor({
        users: [{ name: "User 1" }, { name: "User 2" }],
      })

      expect(Path.root.walk(store.root)).toBe(store.root)
      expect(Path.parse("/users/1").walk(store.root)).toBe(store.root.users[1])
    })
  })

  describe("State Change Subscriptions", () => {
    it("subscribes to any state changes", () => {
      const initialState = {
        users: [{ name: "User 1" }],
      }

      const store = new Arbor(initialState)

      return new Promise((resolve) => {
        store.subscribe((newState, oldState) => {
          expect(initialState).toBe(oldState)
          expect(oldState).toEqual({
            users: [{ name: "User 1" }],
          })

          expect(newState).toEqual({
            users: [{ name: "User 1" }, { name: "User 2" }],
          })

          resolve(newState)
        })

        store.root.users.push({ name: "User 2" })
      })
    })
  })

  describe("Focus array use cases", () => {
    it("accurately mutates an array node after reversing the array", () => {
      const store = new Arbor([
        { name: "User 1" },
        { name: "User 2" },
        { name: "User 3" },
      ])

      warmup(store.root[0])
      warmup(store.root[1])
      warmup(store.root[2])

      store.root.reverse()

      warmup(store.root[0])
      warmup(store.root[1])
      warmup(store.root[2])

      store.root[0].name = "User 3 Updated"

      const user1 = warmup(store.root[0])
      const user2 = warmup(store.root[1])
      const user3 = warmup(store.root[2])

      expect(user1.$path.toString()).toEqual("/0")
      expect(user2.$path.toString()).toEqual("/1")
      expect(user3.$path.toString()).toEqual("/2")

      expect(user1.name).toEqual("User 3 Updated")
      expect(user2.name).toEqual("User 2")
      expect(user3.name).toEqual("User 1")
      expect(store.root).toEqual([
        { name: "User 3 Updated" },
        { name: "User 2" },
        { name: "User 1" },
      ])
    })

    it("deleting items keep paths up-to-date", () => {
      const store = new Arbor([
        { name: "User 1" },
        { name: "User 2" },
        { name: "User 3" },
      ])

      warmup(store.root[0])
      warmup(store.root[1])
      warmup(store.root[2])

      delete store.root[0]

      const user1 = warmup(store.root[0])
      const user2 = warmup(store.root[1])

      expect(user1.$path.toString()).toEqual("/0")
      expect(user2.$path.toString()).toEqual("/1")

      expect(user1.name).toEqual("User 2")
      expect(user2.name).toEqual("User 3")
      expect(store.root).toEqual([{ name: "User 2" }, { name: "User 3" }])
    })
  })

  describe("custom data model", () => {
    class Todo extends Model<Todo> {
      id: string
      text: string
      completed = false

      complete() {
        this.completed = true
      }

      activate() {
        this.completed = false
      }

      get status() {
        return this.completed ? "Completed" : "Active"
      }
    }

    it("supports user defined data models", () => {
      const store = new Arbor([
        new Todo({ text: "Do the dishes", completed: false }),
        new Todo({ text: "Clean the house", completed: true }),
      ])

      const todo1 = store.root[0]
      const todo2 = store.root[1]

      todo1.text = "Walk the dog"

      expect(todo1).not.toBe(store.root[0])
      expect(todo2).toBe(store.root[1])
      expect(store.root).toEqual([
        new Todo({ text: "Walk the dog", completed: false }),
        new Todo({ text: "Clean the house", completed: true }),
      ])
    })

    it("can encasupate mutation logic", () => {
      const store = new Arbor([
        new Todo({ text: "Do the dishes", completed: false }),
        new Todo({ text: "Clean the house", completed: true }),
      ])

      let todo = store.root[0]
      store.root[0].complete()

      expect(store.root[0]).not.toBe(todo)
      expect(store.root[0].completed).toBe(true)

      todo = store.root[0]
      store.root[0].activate()

      expect(store.root[0]).not.toBe(todo)
      expect(store.root[0].completed).toBe(false)
    })
  })
})
