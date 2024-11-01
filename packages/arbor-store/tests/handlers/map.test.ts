import { describe, expect, it } from "vitest"

import { Arbor } from "../../src/arbor"

describe("MapHandler", () => {
  describe("Symbol.iterator", () => {
    it("exposes child nodes via Map#entries", () => {
      const store = new Arbor(
        new Map([
          [0, { name: "Alice" }],
          [1, { name: "Bob" }],
          [2, { name: "Carol" }],
        ])
      )

      const alice = store.state.get(0)
      const bob = store.state.get(1)
      const carol = store.state.get(2)

      const entries = store.state.entries()

      const entry1 = entries.next().value
      const entry2 = entries.next().value
      const entry3 = entries.next().value

      expect(entry1[0]).toEqual(0)
      expect(entry1[1]).toBe(alice)
      expect(entry2[0]).toEqual(1)
      expect(entry2[1]).toBe(bob)
      expect(entry3[0]).toEqual(2)
      expect(entry3[1]).toBe(carol)
    })

    it("exposes child nodes via iterator", () => {
      const store = new Arbor(
        new Map([
          [0, { name: "Alice" }],
          [1, { name: "Bob" }],
          [2, { name: "Carol" }],
        ])
      )

      const alice = store.state.get(0)
      const bob = store.state.get(1)
      const carol = store.state.get(2)

      const entries = store.state[Symbol.iterator]()

      const entry1 = entries.next().value
      const entry2 = entries.next().value
      const entry3 = entries.next().value

      expect(entry1[0]).toEqual(0)
      expect(entry1[1]).toBe(alice)
      expect(entry2[0]).toEqual(1)
      expect(entry2[1]).toBe(bob)
      expect(entry3[0]).toEqual(2)
      expect(entry3[1]).toBe(carol)
    })

    it("exposes child nodes via spread operator", () => {
      const store = new Arbor(
        new Map([
          [0, { name: "Alice" }],
          [1, { name: "Bob" }],
          [2, { name: "Carol" }],
        ])
      )

      const alice = store.state.get(0)
      const bob = store.state.get(1)
      const carol = store.state.get(2)

      const entries = [...store.state]

      const entry1 = entries[0]
      const entry2 = entries[1]
      const entry3 = entries[2]

      expect(entry1[0]).toEqual(0)
      expect(entry1[1]).toBe(alice)
      expect(entry2[0]).toEqual(1)
      expect(entry2[1]).toBe(bob)
      expect(entry3[0]).toEqual(2)
      expect(entry3[1]).toBe(carol)
    })
  })
})
