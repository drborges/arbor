import { describe, expect, it } from "vitest"
import { Arbor } from "../../src/arbor"
import { ScopedStore } from "../../src/scoping/store"
import { unwrap } from "../../src/utilities"

describe("map", () => {
  describe("#get", () => {
    it("access children nodes", () => {
      const bob = { name: "Bob" }
      const alice = { name: "Alice" }
      const store = new Arbor(
        new Map([
          [1, alice],
          [2, bob],
        ])
      )

      const scope = new ScopedStore(store)

      const scopedNode1 = scope.state.get(1)
      const scopedNode2 = scope.state.get(2)

      expect(unwrap(scopedNode1)).toBeNodeOf(alice)
      expect(unwrap(scopedNode2)).toBeNodeOf(bob)
      expect(scopedNode1).toBeScopedNode()
      expect(scopedNode2).toBeScopedNode()
    })
  })

  describe("Symbol.iterator", () => {
    it("can convert a map node from a scoped store to array", () => {
      const store = new Arbor(
        new Map([
          [1, "Alice"],
          [2, "Bob"],
        ])
      )

      const scope = new ScopedStore(store)
      const list = Array.from(scope.state)

      expect(list).toEqual([
        [1, "Alice"],
        [2, "Bob"],
      ])
    })

    it("exposes scoped nodes", () => {
      const bob = { name: "Bob" }

      const alice = { name: "Alice" }
      const store = new Arbor(
        new Map([
          [1, alice],
          [2, bob],
        ])
      )

      const scope = new ScopedStore(store)

      const list = Array.from(scope.state)

      expect(unwrap(list[0][1])).toBeNodeOf(alice)
      expect(unwrap(list[1][1])).toBeNodeOf(bob)
      expect(list[0][1]).toBeScopedNode()
      expect(list[1][1]).toBeScopedNode()
    })
  })
})
