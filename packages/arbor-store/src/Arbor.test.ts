/* eslint-disable @typescript-eslint/no-unused-expressions */
import Path from "./Path"
import Arbor from "./Arbor"
import { warmup } from "./test.helpers"

type User = {
  name: string
}

describe("Arbor", () => {
  describe("#root", () => {
    it("retrieves the root node", () => {
      const initialState = {
        users: [{ name: "User 1" }, { name: "User 2" }],
      }
      const store = new Arbor<{ users: User[] }>(initialState)

      const node = store.root

      expect(node.$unwrap()).toBe(initialState)
    })
  })

  describe("#setRoot", () => {
    it("sets a value as the root of the store", () => {
      const initialState = {
        users: [{ name: "User 1" }, { name: "User 2" }],
      }
      const store = new Arbor<{ users: User[] }>()
      const node = store.setRoot(initialState)

      const nodeFromCache = store.root

      expect(nodeFromCache).toBe(node)
      expect(nodeFromCache.users[1].name).toEqual("User 2")
    })
  })

  describe("Path walking", () => {
    it("walks a proxied path", () => {
      const path = Path.parse("/users/1")
      const store = new Arbor<{ users: User[] }>({
        users: [{ name: "User 1" }, { name: "User 2" }],
      })

      expect(path.walk(store.root)).toBe(store.root.users[1])
    })
  })

  describe("State Change Subscriptions", () => {
    it("subscribes to any state changes", () => {
      const initialState = {
        users: [{ name: "User 1" }],
      }

      const store = new Arbor<{ users: User[] }>(initialState)

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
})
