import { describe, expect, it } from "vitest"

import { Arbor } from "../../src/arbor"

describe("DefaultHandler", () => {
  describe("Symbol.iterator", () => {
    it("exposes child nodes via Object.entries", () => {
      const store = new Arbor({
        user1: { name: "Alice" },
        user2: { name: "Bob" },
        user3: { name: "Carol" },
      })

      const alice = store.state.user1
      const bob = store.state.user2
      const carol = store.state.user3

      const entries = Object.entries(store.state)

      expect(entries[0][0]).toEqual("user1")
      expect(entries[0][1]).toBe(alice)
      expect(entries[1][0]).toEqual("user2")
      expect(entries[1][1]).toBe(bob)
      expect(entries[2][0]).toEqual("user3")
      expect(entries[2][1]).toBe(carol)
    })

    it("exposes child nodes via spread operator", () => {
      const store = new Arbor({
        user1: { name: "Alice" },
        user2: { name: "Bob" },
        user3: { name: "Carol" },
      })

      const alice = store.state.user1
      const bob = store.state.user2
      const carol = store.state.user3

      const users = { ...store.state }

      expect(users.user1).toBe(alice)
      expect(users.user2).toBe(bob)
      expect(users.user3).toBe(carol)
    })
  })
})
