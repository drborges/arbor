import { describe, expect, it, vi } from "vitest"

import { $ } from "../../src/types"
import { OST } from "../../src/ost"
import { node } from "../../src/decorators/node"
import { DetachedPathError } from "../../src/errors"
import { detached } from "../../src/decorators/detached"

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
})
