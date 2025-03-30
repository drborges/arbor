import { describe, expect, it } from "vitest"

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

      expect(ost).not.toHaveNodeFor(state)
      expect(ost).not.toHaveNodeFor(state.todos)
      expect(ost).not.toHaveNodeFor(state.todos[0])
      expect(ost).not.toHaveNodeFor(state.todos[0].author)
      expect(ost).not.toHaveNodeFor(state.todos[1])
      expect(ost).not.toHaveNodeFor(state.todos[1].author)

      const $root = ost.createNode(state)

      expect(ost).toHaveNodeFor(state)
      expect(ost).not.toHaveNodeFor(state.todos)
      expect(ost).not.toHaveNodeFor(state.todos[0])
      expect(ost).not.toHaveNodeFor(state.todos[0].author)
      expect(ost).not.toHaveNodeFor(state.todos[1])
      expect(ost).not.toHaveNodeFor(state.todos[1].author)

      $root.todos

      expect(ost).toHaveNodeFor(state)
      expect(ost).toHaveNodeFor(state.todos)
      expect(ost).not.toHaveNodeFor(state.todos[0])
      expect(ost).not.toHaveNodeFor(state.todos[0].author)
      expect(ost).not.toHaveNodeFor(state.todos[1])
      expect(ost).not.toHaveNodeFor(state.todos[1].author)

      $root.todos[0]

      expect(ost).toHaveNodeFor(state)
      expect(ost).toHaveNodeFor(state.todos)
      expect(ost).toHaveNodeFor(state.todos[0])
      expect(ost).not.toHaveNodeFor(state.todos[0].author)
      expect(ost).not.toHaveNodeFor(state.todos[1])
      expect(ost).not.toHaveNodeFor(state.todos[1].author)

      $root.todos[0].author

      expect(ost).toHaveNodeFor(state)
      expect(ost).toHaveNodeFor(state.todos)
      expect(ost).toHaveNodeFor(state.todos[0])
      expect(ost).toHaveNodeFor(state.todos[0].author)
      expect(ost).not.toHaveNodeFor(state.todos[1])
      expect(ost).not.toHaveNodeFor(state.todos[1].author)

      $root.todos[1]

      expect(ost).toHaveNodeFor(state)
      expect(ost).toHaveNodeFor(state.todos)
      expect(ost).toHaveNodeFor(state.todos[0])
      expect(ost).toHaveNodeFor(state.todos[0].author)
      expect(ost).toHaveNodeFor(state.todos[1])
      expect(ost).not.toHaveNodeFor(state.todos[1].author)

      $root.todos[1].author

      expect(ost).toHaveNodeFor(state)
      expect(ost).toHaveNodeFor(state.todos)
      expect(ost).toHaveNodeFor(state.todos[0])
      expect(ost).toHaveNodeFor(state.todos[0].author)
      expect(ost).toHaveNodeFor(state.todos[1])
      expect(ost).toHaveNodeFor(state.todos[1].author)
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
