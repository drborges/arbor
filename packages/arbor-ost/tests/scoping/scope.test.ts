import { describe, expect, it, vi } from "vitest"
import { Scope } from "../../src/scoping/scope"
import { OST } from "../../src/ost"

describe("Scope", () => {
  describe("$object", () => {
    it("tracks property access on root nodes", () => {
      const ost = new OST({ a: { b: 2 }, c: 3 })
      const scope = new Scope(ost)
      const subscriber = vi.fn()

      scope.subscribe(subscriber)

      ost.root.c = 4

      expect(subscriber).not.toHaveBeenCalled()

      void scope.root.c

      ost.root.c = 5

      expect(subscriber).toHaveBeenCalled()
    })

    it("tracks property access on deeply nested nodes", () => {
      const ost = new OST({ a: { b: { c: { d: 2, e: 3 } } }, f: 2 })
      const scope = new Scope(ost)
      const subscriber = vi.fn()

      scope.subscribe(subscriber)

      ost.root.a.b.c.d = 4

      expect(subscriber).not.toHaveBeenCalled()

      void scope.root.a.b.c.d

      ost.root.f = 5 // untracked by the scope
      ost.root.a.b.c.e = 5 // untracked by the scope
      ost.root.a.b.c.d = 5
      ost.root.a.b.c = { d: 6, e: 4 } as typeof ost.root.a.b.c
      ost.root.a.b = { c: { d: 6, e: 4 } } as typeof ost.root.a.b
      ost.root.a = { b: { c: { d: 6, e: 4 } } } as typeof ost.root.a

      expect(subscriber).toHaveBeenCalledTimes(4)
    })

    it("caches the scope proxies for optimal memory usage", () => {
      const ost = new OST({ a: { b: { c: { d: 2, e: 3 } } }, f: 2 })
      const scope = new Scope(ost)

      expect(scope.root).toBe(scope.root)
      expect(scope.root.a).toBe(scope.root.a)
      expect(scope.root.a.b).toBe(scope.root.a.b)
      expect(scope.root.a.b.c).toBe(scope.root.a.b.c)
      expect(scope.root.a.b.c.d).toBe(scope.root.a.b.c.d)
      expect(scope.root.a.b.c.e).toBe(scope.root.a.b.c.e)
      expect(scope.root.f).toBe(scope.root.f)
    })
  })

  describe("$array", () => {
    describe("Symbol.iterator", () => {
      it("exposes tracked nodes", () => {
        const ost = new OST([{ a: 1 }, { b: 1 }])
        const scope = new Scope(ost)

        const iterator = scope.root[Symbol.iterator]()

        expect(iterator.next().value).toBe(scope.root[0])
        expect(iterator.next().value).toBe(scope.root[1])
        expect(iterator.next().done).toBe(true)
      })
    })

    describe("#values", () => {
      it("exposes tracked nodes", () => {
        const ost = new OST([{ a: 1 }, { b: 1 }])
        const scope = new Scope(ost)

        const iterator = scope.root.values()

        expect(iterator.next().value).toBe(scope.root[0])
        expect(iterator.next().value).toBe(scope.root[1])
        expect(iterator.next().done).toBe(true)
      })
    })

    describe("#find", () => {
      it("exposes tracked node", () => {
        const ost = new OST([{ a: 1 }, { a: 2 }])
        const scope = new Scope(ost)

        const node1 = scope.root.find((n) => n.a === 1)
        const node2 = scope.root.find((n) => n.a === 2)

        expect(node1).toBe(scope.root[0])
        expect(node2).toBe(scope.root[1])
      })
    })
  })

  describe("$map", () => {
    describe("#get", () => {
      it.skip("tracks property access of items", () => {
        const ost = new OST(
          new Map([
            [0, { a: 1, b: 2 }],
            [1, { a: 2, b: 3 }],
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        void scope.root.get(0).a

        ost.root.get(0).a = 2
        ost.root.get(0).b = 3
        ost.root.get(1).a = 1
        ost.root.get(1).b = 2

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })
  })
})
