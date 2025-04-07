import { describe, expect, it, vi } from "vitest"

import { OST } from "../../src/ost"

describe("$array", () => {
  describe("#push", () => {
    it("mutates the underlying value", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      }

      const ost = new OST(state)
      const newTodoValue = { id: 3, content: "Learn LLM" }
      const length = ost.root.todos.push(newTodoValue)

      expect(length).toEqual(3)
      expect(ost.root.todos[2].$value).toBe(newTodoValue)
    })

    it("notifies subscribers of a new item in the array", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      }

      const subscriber = vi.fn()
      const ost = new OST(state)
      ost.subscribe(subscriber)
      ost.root.todos.push({ id: 3, content: "Learn LLM" })

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      }

      const ost = new OST(state)
      const newTodo1 = { id: 3, content: "Learn LLM" }
      const newTodo2 = { id: 4, content: "Implement dev tools" }

      return new Promise(resolve => {
        ost.subscribe(event => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.props).toEqual([2, 3])
          expect(event.metadata.operation).toEqual("push")
          expect(event.metadata.oldValue).toBeUndefined()
          expect(event.metadata.newValue).toEqual([newTodo1, newTodo2])
          resolve(true)
        })

        ost.root.todos.push(
          newTodo1,
          newTodo2,
        )
      })
    })
  })

  describe("#pop", () => {
    it("mutates the underlying value", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const state = {
        todos: [
          todo1,
          todo2,
        ],
      }

      const ost = new OST(state)
      const $todo2 = ost.root.todos[1]
      const removed = ost.root.todos.pop()

      expect(state.todos.length).toEqual(1)
      expect(removed).toBe(todo2)
      expect($todo2).toBeDetachedFrom(ost)
    })

    it("notifies subscribers of a new item in the array", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      }

      const subscriber = vi.fn()
      const ost = new OST(state)
      ost.subscribe(subscriber)
      ost.root.todos.pop()

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const state = {
        todos: [
          todo1,
          todo2,
        ],
      }

      const ost = new OST(state)

      return new Promise(resolve => {
        ost.subscribe(event => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.props).toEqual([1])
          expect(event.metadata.operation).toEqual("pop")
          expect(event.metadata.oldValue).toBe(todo2)
          expect(event.metadata.newValue).toBeUndefined()
          resolve(true)
        })

        ost.root.todos.pop()
      })
    })
  })

  describe("shift", () => {
    it("mutates the underlying value", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const state = {
        todos: [
          todo1,
          todo2,
        ],
      }

      const ost = new OST(state)
      const $todo1 = ost.root.todos[0]
      const removed = ost.root.todos.shift()

      expect(state.todos.length).toEqual(1)
      expect(removed).toBe(todo1)
      expect($todo1).toBeDetachedFrom(ost)
    })

    it("notifies subscribers of a new item in the array", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      }

      const subscriber = vi.fn()
      const ost = new OST(state)
      ost.subscribe(subscriber)
      ost.root.todos.shift()

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const state = {
        todos: [
          todo1,
          todo2,
        ],
      }

      const ost = new OST(state)

      return new Promise(resolve => {
        ost.subscribe(event => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.props).toEqual([0])
          expect(event.metadata.operation).toEqual("shift")
          expect(event.metadata.oldValue).toBe(todo1)
          expect(event.metadata.newValue).toBe(todo2)
          resolve(true)
        })

        ost.root.todos.shift()
      })
    })
  })
})
