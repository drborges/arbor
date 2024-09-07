import { describe, expect, it } from "vitest"
import { Arbor } from "../../src/arbor"
import { ScopedStore } from "../../src/scoping/store"

describe("map", () => {
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

      expect(scope.state.get(1)).toBeTrackedNode()
      expect(scope.state.get(2)).toBeTrackedNode()

      // const list = Array.from(scope.state)

      // expect(list[0][1]).toBeNodeOf(alice)
      // expect(list[1][1]).toBeNodeOf(bob)
      // expect(list[0][1]).toBeTrackedNode()
      // expect(list[1][1]).toBeTrackedNode()
    })
  })
})
