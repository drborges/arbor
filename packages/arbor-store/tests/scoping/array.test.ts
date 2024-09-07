import { describe, expect, it, vi } from "vitest"
import { Arbor } from "../../src/arbor"
import { ScopedStore } from "../../src/scoping/store"

describe("Array", () => {
  describe("Array#splice", () => {
    it("splices multiple items in a row", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Walk the dogs" },
        ],
      })

      const scoped = new ScopedStore(store)

      scoped.state.todos.splice(1, 1)

      expect(scoped.state).toEqual({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 3, text: "Walk the dogs" },
        ],
      })

      scoped.state.todos.splice(1, 1)

      expect(scoped.state).toEqual({
        todos: [{ id: 1, text: "Do the dishes" }],
      })
    })

    it("notifies subscribers when the array changes even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Walk the dogs" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      // accessing scoped.state.todos causes the scope to track that path
      scoped.state.todos.splice(1, 1)
      scoped.state.todos.splice(1, 1)

      expect(subscriber).toHaveBeenCalledTimes(2)
    })

    it("notifies subscribers when the array changes via delete operation even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Walk the dogs" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      delete scoped.state.todos[1]
      delete scoped.state.todos[1]

      expect(scoped).not.toBeTracking(scoped.state.todos, 1)

      expect(subscriber).toHaveBeenCalledTimes(2)
    })
  })
})
