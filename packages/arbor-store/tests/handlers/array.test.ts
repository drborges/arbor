import { describe, expect, it } from "vitest"

import { Arbor } from "../../src/arbor"

describe("ArrayHandler", () => {
  describe("Symbol.iterator", () => {
    it("exposes child nodes via iterator", () => {
      const store = new Arbor([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Carol" },
      ])

      const alice = store.state[0]
      const bob = store.state[1]
      const carol = store.state[2]

      const iterator = store.state[Symbol.iterator]()

      const user1 = iterator.next().value
      const user2 = iterator.next().value
      const user3 = iterator.next().value

      expect(user1).toBe(alice)
      expect(user2).toBe(bob)
      expect(user3).toBe(carol)
    })

    it("exposes child nodes", () => {
      const store = new Arbor([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Carol" },
      ])

      const alice = store.state[0]
      const bob = store.state[1]
      const carol = store.state[2]

      const entries = Object.entries(store.state)

      expect(entries[0][0]).toEqual("0")
      expect(entries[0][1]).toBe(alice)
      expect(entries[1][0]).toEqual("1")
      expect(entries[1][1]).toBe(bob)
      expect(entries[2][0]).toEqual("2")
      expect(entries[2][1]).toBe(carol)
    })

    it("exposes child nodes via spread operator", () => {
      const store = new Arbor([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Carol" },
      ])

      const alice = store.state[0]
      const bob = store.state[1]
      const carol = store.state[2]

      const users = [...store.state]

      expect(users[0]).toBe(alice)
      expect(users[1]).toBe(bob)
      expect(users[2]).toBe(carol)
    })
  })
})
