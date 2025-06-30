import { describe, expect, it, vi } from "vitest"

import { OST } from "../../src/ost"
import { node } from "../../src/decorators/node"

describe("$weakMap", () => {
  describe("#set", () => {
    it("mutates the underlying value", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const newKey = { id: 3 }
      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.set(newKey, newTodoValue)

      expect(ost.root.todos.has(newKey)).toBe(true)
      expect(ost.root.todos.get(newKey).$value).toBe(newTodoValue)
    })

    it("can store non-proxiable values", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, "Learn Arbor")
      todos.set(key2, "Implement OST")

      const newKey = { id: 3 }
      const newTodoValue = "Learn LLM"
      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.set(newKey, newTodoValue)

      expect(ost.root.todos.has(newKey)).toBe(true)
      expect(ost.root.todos.get(newKey)).toBe(newTodoValue)
    })

    it("notifies subscribers of a new item in the weakmap", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const newKey = { id: 3 }
      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      ost.root.todos.set(newKey, newTodoValue)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const newKey = { id: 3 }
      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      ost.root.todos.set(newKey, newTodoValue)

      expect(subscriber).toHaveBeenCalledWith({
        target: ost.root.todos,
        metadata: {
          operation: "set",
          args: [newKey, newTodoValue],
        },
      })
    })

    it("returns the WeakMap instance for chaining", () => {
      const key = { id: 1 }
      const todos = new WeakMap()
      const state = { todos }
      const ost = new OST(state)

      const result = ost.root.todos.set(key, { content: "test" })

      expect(result).toBe(ost.root.todos)
    })
  })

  describe("#get", () => {
    it("returns the node of the value for the given key", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      const value = ost.root.todos.get(key1)

      expect(value.id).toBe(1)
      expect(value.content).toBe("Learn Arbor")
    })

    it("returns non-proxiable values as is", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, "Learn Arbor")
      todos.set(key2, "Implement OST")

      const state = { todos }
      const ost = new OST(state)

      const value = ost.root.todos.get(key1)

      expect(value).toBe("Learn Arbor")
    })

    it("returns undefined for non-existent keys", () => {
      const key1 = { id: 1 }
      const nonExistentKey = { id: 999 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })

      const state = { todos }
      const ost = new OST(state)

      const value = ost.root.todos.get(nonExistentKey)

      expect(value).toBeUndefined()
    })

    it("caches the node representing the weakmap item", () => {
      const key1 = { id: 1 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })

      const state = { todos }
      const ost = new OST(state)

      const value1 = ost.root.todos.get(key1)
      const value2 = ost.root.todos.get(key1)

      expect(value1).toBe(value2)
    })
  })

  describe("#delete", () => {
    it("mutates the underlying value", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      const result = ost.root.todos.delete(key1)

      expect(result).toBe(true)
      expect(ost.root.todos.has(key1)).toBe(false)
    })

    it("returns false when deleting non-existent key", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const nonExistentKey = { id: 999 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      const result = ost.root.todos.delete(nonExistentKey)

      expect(result).toBe(false)
    })

    it("notifies subscribers of a deleted item", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      ost.root.todos.delete(key1)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("does not notify subscribers if deleted key does not exist in the weakmap", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const nonExistentKey = { id: 999 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      ost.root.todos.delete(nonExistentKey)

      expect(subscriber).not.toHaveBeenCalled()
    })

    it("exposes mutation event metadata to subscribers", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      ost.root.todos.delete(key1)

      expect(subscriber).toHaveBeenCalledWith({
        target: ost.root.todos,
        metadata: {
          operation: "delete",
          args: [key1],
        },
      })
    })
  })

  describe("#has", () => {
    it("returns true if the given key exists in the weakmap", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const nonExistentKey = { id: 999 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })
      todos.set(key2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.has(key1)).toBe(true)
      expect(ost.root.todos.has(key2)).toBe(true)
      expect(ost.root.todos.has(nonExistentKey)).toBe(false)
    })

    it("works with complex object keys", () => {
      const complexKey = { nested: { data: "test" }, array: [1, 2, 3] }
      const value = { content: "complex test" }
      const todos = new WeakMap()
      todos.set(complexKey, value)

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.has(complexKey)).toBe(true)
    })

    it("does not trigger mutations or notifications", () => {
      const key1 = { id: 1 }
      const todos = new WeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      ost.root.todos.has(key1)

      expect(subscriber).not.toHaveBeenCalled()
    })
  })

  describe("WeakMap constraints", () => {
    it("only accepts object keys", () => {
      const todos = new WeakMap()
      const state = { todos }
      const ost = new OST(state)

      // These should work (objects as keys)
      const objKey = { id: 1 }
      const funcKey = () => {} // eslint-disable-line @typescript-eslint/no-empty-function
      const arrayKey = [1, 2, 3]

      expect(() => ost.root.todos.set(objKey, "value1")).not.toThrow()
      expect(() => ost.root.todos.set(funcKey, "value2")).not.toThrow()
      expect(() => ost.root.todos.set(arrayKey, "value3")).not.toThrow()

      expect(ost.root.todos.has(objKey)).toBe(true)
      expect(ost.root.todos.has(funcKey)).toBe(true)
      expect(ost.root.todos.has(arrayKey)).toBe(true)
    })

    it("handles complex object keys correctly", () => {
      const complexKey = { nested: { data: "test" }, array: [1, 2, 3] }
      const value = { content: "complex test" }
      const todos = new WeakMap()

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.set(complexKey, value)

      expect(ost.root.todos.has(complexKey)).toBe(true)
      expect(ost.root.todos.get(complexKey).$value).toBe(value)
    })
  })

  describe("custom @node weakmaps", () => {
    @node
    class MyWeakMap extends WeakMap {
      setIfNotExists(key: object, value: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!this.has(key)) {
          this.set(key, value)
          return true
        }
        return false
      }

      getWithDefault(key: object, defaultValue: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return this.has(key) ? this.get(key) : defaultValue
      }
    }

    it("supports custom WeakMap types when decorated with @node", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new MyWeakMap()
      todos.set(key1, { id: 1, content: "Learn Arbor" })

      const state = { todos }
      const ost = new OST(state)

      expect(
        ost.root.todos.setIfNotExists(key2, { id: 2, content: "Test" })
      ).toBe(true)
      expect(
        ost.root.todos.setIfNotExists(key1, { id: 1, content: "Updated" })
      ).toBe(false)
      expect(ost.root.todos.getWithDefault(key2, null).$value).toEqual({
        id: 2,
        content: "Test",
      })
    })

    it("executes custom methods within the context of the proxy", () => {
      const key1 = { id: 1 }
      const todos = new MyWeakMap()

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      ost.root.todos.setIfNotExists(key1, { id: 1, content: "Test" })

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("custom methods trigger mutations when appropriate", () => {
      const key1 = { id: 1 }
      const todos = new MyWeakMap()

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      // First call should trigger mutation
      ost.root.todos.setIfNotExists(key1, { id: 1, content: "Test" })
      expect(subscriber).toHaveBeenCalledOnce()

      // Second call should not trigger mutation
      ost.root.todos.setIfNotExists(key1, { id: 1, content: "Updated" })
      expect(subscriber).toHaveBeenCalledOnce()
    })
  })

  describe("Edge cases and comprehensive tests", () => {
    it("should handle rapid set/delete operations", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const todos = new WeakMap()

      const state = { todos }
      const ost = new OST(state)

      // Rapid operations
      ost.root.todos.set(key1, "value1")
      ost.root.todos.set(key2, "value2")
      ost.root.todos.delete(key1)
      ost.root.todos.set(key1, "value1-new")

      expect(ost.root.todos.has(key1)).toBe(true)
      expect(ost.root.todos.has(key2)).toBe(true)
      expect(ost.root.todos.get(key1)).toBe("value1-new")
    })

    it("should handle mixed operations", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const key3 = { id: 3 }
      const todos = new WeakMap()

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.set(key1, { content: "test1" })
      expect(ost.root.todos.has(key1)).toBe(true)

      ost.root.todos.set(key2, "string-value")
      expect(ost.root.todos.get(key2)).toBe("string-value")

      ost.root.todos.set(key3, 123)
      expect(ost.root.todos.get(key3)).toBe(123)

      expect(ost.root.todos.delete(key2)).toBe(true)
      expect(ost.root.todos.has(key2)).toBe(false)
    })

    it("should work with different types of object values", () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const key3 = { id: 3 }
      const key4 = { id: 4 }
      const todos = new WeakMap()

      const state = { todos }
      const ost = new OST(state)

      // Object value
      ost.root.todos.set(key1, { nested: "object" })
      expect(ost.root.todos.get(key1).nested).toBe("object")

      // Array value
      ost.root.todos.set(key2, [1, 2, 3])
      expect(ost.root.todos.get(key2)[0]).toBe(1)

      // Function value
      const fn = () => "test"
      ost.root.todos.set(key3, fn)
      expect(ost.root.todos.get(key3)).toBe(fn)

      // Primitive values
      ost.root.todos.set(key4, "primitive")
      expect(ost.root.todos.get(key4)).toBe("primitive")
    })
  })
})
