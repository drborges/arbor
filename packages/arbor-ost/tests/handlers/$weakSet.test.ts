import { describe, expect, it, vi } from "vitest"

import { OST } from "../../src/ost"
import { node } from "../../src/decorators/node"

describe("$weakSet", () => {
  describe("#add", () => {
    it("mutates the underlying value", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.add(newTodoValue)

      expect(ost.root.todos.has(newTodoValue)).toBe(true)
    })

    it("can store complex object values", () => {
      const value1 = { nested: { data: "test" }, array: [1, 2, 3] }
      const value2 = function () {
        return "hello"
      }
      const todos = new WeakSet()

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.add(value1)
      ost.root.todos.add(value2)

      expect(ost.root.todos.has(value1)).toBe(true)
      expect(ost.root.todos.has(value2)).toBe(true)
    })

    it("does not mutate if value already exists", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const todos = new WeakSet()
      todos.add(value1)

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.add(value1) // Adding existing value

      expect(subscriber).not.toHaveBeenCalled()
    })

    it("notifies subscribers of a new item in the weakset", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.add(newTodoValue)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)

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

    it("returns the WeakSet instance for chaining", () => {
      const value = { id: 1, content: "test" }
      const todos = new WeakSet()
      const state = { todos }
      const ost = new OST(state)

      const result = ost.root.todos.add(value)

      expect(result).toBe(ost.root.todos)
    })
  })

  describe("#delete", () => {
    it("mutates the underlying value", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)

      const result = ost.root.todos.delete(value2)

      expect(result).toBe(true)
      expect(ost.root.todos.has(value2)).toBe(false)
    })

    it("returns false when deleting non-existent value", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const nonExistentValue = { id: 999, content: "Non-existent" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)

      const result = ost.root.todos.delete(nonExistentValue)

      expect(result).toBe(false)
    })

    it("notifies subscribers of a deleted item", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.delete(value2)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("does not notify subscribers if deleted value does not exist in the weakset", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const nonExistentValue = { id: 999, content: "Non-existent" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.delete(nonExistentValue)

      expect(subscriber).not.toHaveBeenCalled()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([value2])
          expect(event.metadata.operation).toEqual("delete")
          resolve(true)
        })

        ost.root.todos.delete(value2)
      })
    })
  })

  describe("#has", () => {
    it("returns true if the given value exists in the weakset", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const nonExistentValue = { id: 999, content: "Non-existent" }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.has(value1)).toBe(true)
      expect(ost.root.todos.has(value2)).toBe(true)
      expect(ost.root.todos.has(nonExistentValue)).toBe(false)
    })

    it("works with complex object values", () => {
      const value1 = { nested: { data: "test" }, array: [1, 2, 3] }
      const value2 = function () {
        return "hello"
      }
      const todos = new WeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.has(value1)).toBe(true)
      expect(ost.root.todos.has(value2)).toBe(true)
    })

    it("does not trigger mutations or notifications", () => {
      const value1 = { id: 1, content: "test" }
      const todos = new WeakSet()
      todos.add(value1)

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.has(value1)

      expect(subscriber).not.toHaveBeenCalled()
    })
  })

  describe("WeakSet constraints", () => {
    it("only accepts object values", () => {
      const todos = new WeakSet()
      const state = { todos }
      const ost = new OST(state)

      // These should work (objects as values)
      const objValue = { id: 1 }
      const funcValue = () => {} // eslint-disable-line @typescript-eslint/no-empty-function
      const arrayValue = [1, 2, 3]

      expect(() => ost.root.todos.add(objValue)).not.toThrow()
      expect(() => ost.root.todos.add(funcValue)).not.toThrow()
      expect(() => ost.root.todos.add(arrayValue)).not.toThrow()

      expect(ost.root.todos.has(objValue)).toBe(true)
      expect(ost.root.todos.has(funcValue)).toBe(true)
      expect(ost.root.todos.has(arrayValue)).toBe(true)
    })

    it("handles complex object values correctly", () => {
      const todos = new WeakSet()
      const state = { todos }
      const ost = new OST(state)

      const complexValue = {
        nested: { data: "test" },
        array: [1, 2, 3],
        method: function () {
          return "hello"
        },
      }

      ost.root.todos.add(complexValue)

      expect(ost.root.todos.has(complexValue)).toBe(true)
    })
  })

  describe("custom @node weaksets", () => {
    @node
    class MyWeakSet extends WeakSet {
      addIfNotExists(value: object) {
        if (!this.has(value)) {
          this.add(value)
          return true
        }
        return false
      }

      addAll(...values: object[]) {
        let added = 0
        for (const value of values) {
          if (this.addIfNotExists(value)) {
            added++
          }
        }
        return added
      }
    }

    it("supports custom WeakSet types when decorated with @node", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const todos = new MyWeakSet()
      todos.add(value1)
      todos.add(value2)

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.has(value1)).toBe(true)
      expect(ost.root.todos.has(value2)).toBe(true)
    })

    it("executes custom methods within the context of the proxy", () => {
      const value1 = { id: 1, content: "Learn Arbor" }
      const value2 = { id: 2, content: "Implement OST" }
      const value3 = { id: 3, content: "Learn LLM" }
      const todos = new MyWeakSet()

      const state = { todos }
      const ost = new OST(state)

      // Test addIfNotExists
      expect(ost.root.todos.addIfNotExists(value1)).toBe(true)
      expect(ost.root.todos.addIfNotExists(value1)).toBe(false) // Already exists

      // Test addAll
      expect(ost.root.todos.addAll(value2, value3, value1)).toBe(2) // Only value2 and value3 are new
    })

    it("custom methods trigger mutations when appropriate", () => {
      const value1 = { id: 1, content: "test" }
      const todos = new MyWeakSet()
      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.addIfNotExists(value1)

      expect(subscriber).toHaveBeenCalledOnce()
    })
  })

  describe("Edge cases and comprehensive tests", () => {
    it("should handle rapid add/delete operations", () => {
      const todos = new WeakSet()
      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      const values = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        content: `Task ${i}`,
      }))

      // Rapid add operations
      values.forEach((value) => {
        ost.root.todos.add(value)
      })

      expect(subscriber).toHaveBeenCalledTimes(10)

      // Verify all items exist
      values.forEach((value) => {
        expect(ost.root.todos.has(value)).toBe(true)
      })

      // Rapid delete operations
      values.forEach((value) => {
        ost.root.todos.delete(value)
      })

      expect(subscriber).toHaveBeenCalledTimes(20)

      // Verify all items are gone
      values.forEach((value) => {
        expect(ost.root.todos.has(value)).toBe(false)
      })
    })

    it("should handle mixed operations", () => {
      const todos = new WeakSet()
      const state = { todos }
      const ost = new OST(state)

      const value1 = { id: 1, content: "First" }
      const value2 = { id: 2, content: "Second" }

      // Add, check, add duplicate, check, delete, check
      ost.root.todos.add(value1)
      expect(ost.root.todos.has(value1)).toBe(true)

      ost.root.todos.add(value1) // Add duplicate (should not trigger mutation)
      expect(ost.root.todos.has(value1)).toBe(true)

      ost.root.todos.add(value2) // Add new
      expect(ost.root.todos.has(value1)).toBe(true)
      expect(ost.root.todos.has(value2)).toBe(true)

      ost.root.todos.delete(value1)
      expect(ost.root.todos.has(value1)).toBe(false)
      expect(ost.root.todos.has(value2)).toBe(true)
    })

    it("should handle duplicate add operations without mutations", () => {
      const value1 = { id: 1, content: "test" }
      const todos = new WeakSet()
      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      // First add should trigger mutation
      ost.subscribe(subscriber)
      ost.root.todos.add(value1)
      expect(subscriber).toHaveBeenCalledOnce()

      // Second add of same value should not trigger mutation
      ost.root.todos.add(value1)
      expect(subscriber).toHaveBeenCalledOnce() // Still only once
    })

    it("should handle delete operations on non-existent values", () => {
      const value1 = { id: 1, content: "exists" }
      const value2 = { id: 2, content: "does not exist" }
      const todos = new WeakSet()
      todos.add(value1)

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      // Delete existing value - should trigger mutation
      ost.root.todos.delete(value1)
      expect(subscriber).toHaveBeenCalledOnce()

      // Delete non-existent value - should not trigger mutation
      ost.root.todos.delete(value2)
      expect(subscriber).toHaveBeenCalledOnce() // Still only once
    })

    it("should work with different types of object values", () => {
      const todos = new WeakSet()
      const state = { todos }
      const ost = new OST(state)

      // Different types of objects
      const plainObject = { type: "plain" }
      const array = [1, 2, 3]
      const func = function () {
        return "test"
      }
      const date = new Date()
      const regex = /test/g

      // Add all types
      ost.root.todos.add(plainObject)
      ost.root.todos.add(array)
      ost.root.todos.add(func)
      ost.root.todos.add(date)
      ost.root.todos.add(regex)

      // Verify all exist
      expect(ost.root.todos.has(plainObject)).toBe(true)
      expect(ost.root.todos.has(array)).toBe(true)
      expect(ost.root.todos.has(func)).toBe(true)
      expect(ost.root.todos.has(date)).toBe(true)
      expect(ost.root.todos.has(regex)).toBe(true)

      // Delete some
      ost.root.todos.delete(array)
      ost.root.todos.delete(func)

      expect(ost.root.todos.has(plainObject)).toBe(true)
      expect(ost.root.todos.has(array)).toBe(false)
      expect(ost.root.todos.has(func)).toBe(false)
      expect(ost.root.todos.has(date)).toBe(true)
      expect(ost.root.todos.has(regex)).toBe(true)
    })
  })
})
