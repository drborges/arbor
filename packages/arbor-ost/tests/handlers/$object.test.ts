import { describe, expect, it, vi } from "vitest"

import { OST } from "../../src/ost"

describe("$object", () => {
  describe("lazy OST initialization", () => {
    it("gradually creates nodes in the OST as parts of the state gets accessed", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor", author: { name: "Alice" } },
          { id: 2, content: "Implement OST", author: { name: "Bob" } },
        ],
      }

      const ost = new OST()

      expect(ost.seedOf(state)).toBeUndefined()
      expect(ost.seedOf(state.todos)).toBeUndefined()
      expect(ost.seedOf(state.todos[0])).toBeUndefined()
      expect(ost.seedOf(state.todos[0].author)).toBeUndefined()
      expect(ost.seedOf(state.todos[1])).toBeUndefined()
      expect(ost.seedOf(state.todos[1].author)).toBeUndefined()

      const $root = ost.createNode(state)

      expect(ost.seedOf(state)).toBeDefined()
      expect(ost.seedOf(state.todos)).toBeUndefined()
      expect(ost.seedOf(state.todos[0])).toBeUndefined()
      expect(ost.seedOf(state.todos[0].author)).toBeUndefined()
      expect(ost.seedOf(state.todos[1])).toBeUndefined()
      expect(ost.seedOf(state.todos[1].author)).toBeUndefined()

      $root.todos

      expect(ost.seedOf(state)).toBeDefined()
      expect(ost.seedOf(state.todos)).toBeDefined()
      expect(ost.seedOf(state.todos[0])).toBeUndefined()
      expect(ost.seedOf(state.todos[0].author)).toBeUndefined()
      expect(ost.seedOf(state.todos[1])).toBeUndefined()
      expect(ost.seedOf(state.todos[1].author)).toBeUndefined()
    })

    it("caches nodes when accessing the same path more than once", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      }

      const ost = new OST<typeof state>()
      const $root = ost.createNode(state)
      const $todos = $root.todos
      const $todo1 = $root.todos[0]
      const $todo2 = $root.todos[1]

      expect($root).toBe(ost.root)
      expect($todos).toBe(ost.root.todos)
      expect($todo1).toBe(ost.root.todos[0])
      expect($todo2).toBe(ost.root.todos[1])
    })
  })
})
