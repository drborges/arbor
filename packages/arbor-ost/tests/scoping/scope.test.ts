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

    describe("scope mutations", () => {
      it("can trigger mutations from the scope itself", () => {
        const ost = new OST([{ a: 1 }, { a: 2 }])
        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root.values()

        void iterator.next().value.a++

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe("$map", () => {
    describe("#get", () => {
      it("tracks property access of items", () => {
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

    describe("scope mutations", () => {
      it("can trigger mutations from the scope itself", () => {
        const ost = new OST(
          new Map([
            [0, { a: 1, b: 2 }],
            [1, { a: 2, b: 3 }],
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root.values()

        void iterator.next().value.a++

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })

    describe("#values", () => {
      it("tracks property access of items", () => {
        const ost = new OST(
          new Map([
            [0, { a: 1, b: 2 }],
            [1, { a: 2, b: 3 }],
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root.values()

        void iterator.next().value.a

        ost.root.get(0).a = 2
        ost.root.get(0).b = 3
        ost.root.get(1).a = 3
        ost.root.get(1).b = 4

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })

    describe("#entries", () => {
      it("tracks property access of items", () => {
        const ost = new OST(
          new Map([
            [0, { a: 1, b: 2 }],
            [1, { a: 2, b: 3 }],
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root.entries()

        void iterator.next().value[1].a

        ost.root.get(0).a = 2
        ost.root.get(0).b = 3
        ost.root.get(1).a = 3
        ost.root.get(1).b = 4

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })

    describe("#forEach", () => {
      it("tracks property access of items", () => {
        const ost = new OST(
          new Map([
            [0, { a: 1, b: 2 }],
            [1, { a: 2, b: 3 }],
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        scope.root.forEach((value, key) => {
          if (key === 0) {
            void value.a // scope only tracking property "a" of item where key == 0
          }
        })

        ost.root.get(0).a = 2
        ost.root.get(0).b = 3
        ost.root.get(1).a = 3
        ost.root.get(1).b = 4

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })

    describe("Symbol.iterator", () => {
      it("tracks property access of items", () => {
        const ost = new OST(
          new Map([
            [0, { a: 1, b: 2 }],
            [1, { a: 2, b: 3 }],
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root[Symbol.iterator]()

        void iterator.next().value[1].a

        ost.root.get(0).a = 2
        ost.root.get(0).b = 3
        ost.root.get(1).a = 3
        ost.root.get(1).b = 4

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe("$set", () => {
    describe("scope mutations", () => {
      it("can trigger mutations from the scope itself", () => {
        const ost = new OST(
          new Set([
            { a: 1, b: 2 },
            { a: 2, b: 3 },
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root.values()

        iterator.next().value.a++

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })

    describe("#values", () => {
      it("tracks property access of items", () => {
        const ost = new OST(
          new Set([
            { a: 1, b: 2 },
            { a: 2, b: 3 },
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root.values()

        void iterator.next().value.a

        for (const node of ost.root.values()) {
          node.a = 4
          node.b = 5
        }

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })

    describe("#entries", () => {
      it("tracks property access of items", () => {
        const ost = new OST(
          new Set([
            { a: 1, b: 2 },
            { a: 2, b: 3 },
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root.entries()

        void iterator.next().value[1].a

        for (const node of ost.root.values()) {
          node.a = 4
          node.b = 5
        }

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })

    describe("#forEach", () => {
      it("tracks property access of items", () => {
        const ost = new OST(
          new Set([
            { a: 1, b: 2 },
            { a: 2, b: 3 },
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        scope.root.forEach((value) => {
          void value.a
        })

        const iterator = ost.root.values()

        const first = iterator.next().value
        const second = iterator.next().value

        first.a = 2
        first.b = 3
        second.a = 3
        second.b = 4

        expect(subscriber).toHaveBeenCalledTimes(2)
      })
    })

    describe("Symbol.iterator", () => {
      it("tracks property access of items", () => {
        const ost = new OST(
          new Set([
            { a: 1, b: 2 },
            { a: 2, b: 3 },
          ])
        )

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const iterator = scope.root[Symbol.iterator]()

        void iterator.next().value.a

        for (const node of ost.root.values()) {
          node.a = 4
          node.b = 5
        }

        expect(subscriber).toHaveBeenCalledOnce()
      })
    })

    describe("#has", () => {
      it("understands raw/unproxied values as arguments", () => {
        const item1 = { a: 1, b: 2 }
        const item2 = { a: 2, b: 3 }

        const ost = new OST(new Set([item1, item2]))

        const scope = new Scope(ost)
        const ostValues = ost.root.values()
        const scopeValues = scope.root.values()

        const node1 = ostValues.next().value
        const node2 = ostValues.next().value

        const scoped1 = scopeValues.next().value
        const scoped2 = scopeValues.next().value

        expect(scope.root.has(item1)).toBe(true)
        expect(scope.root.has(item2)).toBe(true)

        expect(scope.root.has(node1)).toBe(true)
        expect(scope.root.has(node2)).toBe(true)

        expect(scope.root.has(scoped1)).toBe(true)
        expect(scope.root.has(scoped2)).toBe(true)
      })
    })

    describe("#difference", () => {
      it("can path track items in the result diff", () => {
        const item1 = { a: 1, b: 2 }
        const item2 = { a: 2, b: 3 }
        const item3 = { a: 4, b: 5 }
        const setA = new Set([item1, item2, item3])

        const setB = new Set([item3])

        const ost = new OST(setA)

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const scoped = scope.root.difference(setB)

        const iterator = scoped.values()

        void iterator.next().value.a

        for (const node of ost.root.values()) {
          node.a = 4
          node.b = 5
        }

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })

    describe("#intersection", () => {
      it("can path track items in the result diff", () => {
        const item1 = { a: 1, b: 2 }
        const item2 = { a: 2, b: 3 }
        const item3 = { a: 4, b: 5 }
        const setA = new Set([item1, item2, item3])

        const setB = new Set([item2, item3])

        const ost = new OST(setA)

        const subscriber = vi.fn()
        const scope = new Scope(ost)
        scope.subscribe(subscriber)

        const scoped = scope.root.intersection(setB)

        const iterator = scoped.values()

        void iterator.next().value.a

        for (const node of ost.root.values()) {
          node.a = 4
          node.b = 5
        }

        expect(subscriber).toHaveBeenCalledTimes(1)
      })
    })
  })
})
