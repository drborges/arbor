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

    it("binds this in methods to the corresponding OST node", () => {
      const state = {
        completed() {
          return this.todos.filter((t) => t.done)
        },
        todos: [
          {
            id: 1,
            content: "Learn Arbor",
            done: true,
          },
          {
            id: 2,
            content: "Implement OST",
            done: false,
          },
        ],
      }

      const ost = new OST<typeof state>()
      const $root = ost.createNode(state)
      const $firstTodo = $root.todos[0]

      const completedTodos = $root.completed()

      expect(completedTodos.length).toBe(1)
      expect(completedTodos[0]).toBe($firstTodo)
    })
  })

  describe("mutations", () => {
    it("mutates values correctly", () => {
      const state = {
        todos: [
          {
            id: 1,
            content: "Learn Arbor",
            done: false,
            complete() {
              this.done = true
            },
          },
          {
            id: 2,
            content: "Implement OST",
            done: false,
            complete() {
              this.done = true
            },
          },
        ],
      }

      const ost = new OST<typeof state>()
      const $root = ost.createNode(state)

      $root.todos[0].complete()

      expect(state.todos[0].done).toBe(true)
      expect(state.todos[1].done).toBe(false)
    })

    it("notifies subscribers when a node is mutated", () => {
      const state = {
        todos: [
          {
            id: 1,
            content: "Learn Arbor",
            done: false,
            complete() {
              this.done = true
            },
          },
          {
            id: 2,
            content: "Implement OST",
            done: false,
            complete() {
              this.done = true
            },
          },
        ],
      }

      const subscriber = vi.fn()
      const ost = new OST<typeof state>()
      const $root = ost.createNode(state)
      $root.$subscriptions.subscribe(subscriber)

      $root.todos[0].complete()

      expect(subscriber).toHaveBeenCalledTimes(1)
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const state = {
        todos: [
          {
            id: 1,
            content: "Learn Arbor",
            done: false,
            complete() {
              this.done = true
            },
          },
          {
            id: 2,
            content: "Implement OST",
            done: false,
            complete() {
              this.done = true
            },
          },
        ],
      }

      const ost = new OST<typeof state>()
      const $root = ost.createNode(state)

      return new Promise((resolve) => {
        $root.$subscriptions.subscribe((event) => {
          expect(event.mutationPath).toBe(ost.pathOf(state.todos[0]))
          expect(event.state).toBe(state)
          expect(event.metadata.operation).toEqual("set")
          expect(event.metadata.previouslyUndefined).toBe(false)
          expect(event.metadata.props).toEqual(["done"])
          resolve(true)
        })

        $root.todos[0].complete()
      })
    })
  })
})
