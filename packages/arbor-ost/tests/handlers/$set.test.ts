import { describe, expect, it, vi } from "vitest"

import { OST } from "../../src/ost"

describe("$set", () => {
  describe("#add", () => {
    it("mutates the underlying value", () => {
      const todos = new Set()
      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.add(newTodoValue)

      expect(ost.root.$value).toBe(state)
      expect(ost.root.todos.$value).toBe(todos)
      expect(ost.root.todos.size).toEqual(1)
      expect(ost.root.todos.has(newTodoValue)).toBe(true)

      const iterator = ost.root.todos.values()
      const todoNode = iterator.next().value

      expect(todoNode).toBe(ost.nodeOf(newTodoValue))
      expect(ost.root.todos.has(todoNode)).toBe(true)
    })

    it("can store non-proxiable values", () => {
      const todos = new Set()
      const ost = new OST({ todos })

      ost.root.todos.add("Learn LLM")

      expect(ost.root.todos.size).toEqual(1)
      expect(ost.root.todos.has("Learn LLM")).toBe(true)
    })

    it("notifies subscribers of a new item in the array", () => {
      const todos = new Set()
      const ost = new OST({ todos })
      const newTodoValue = { id: 3, content: "Learn LLM" }
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.add(newTodoValue)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todos = new Set()
      const ost = new OST({ todos })
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      return new Promise((resolve) => {
        const newTodoValue = { id: 3, content: "Learn LLM" }

        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([newTodoValue])
          expect(event.metadata.operation).toEqual("add")
          resolve(true)
        })

        ost.root.todos.add(newTodoValue)
      })
    })
  })
})
