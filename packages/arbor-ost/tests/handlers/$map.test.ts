import { describe, expect, it, vi } from "vitest"

import { OST } from "../../src/ost"
import { node } from "../../src/decorators/node"

describe("$map", () => {
  describe("#set", () => {
    it("mutates the underlying value", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.set(3, newTodoValue)

      expect(ost.root.todos.size).toEqual(3)
      expect(ost.root.todos.get(3).$value).toBe(newTodoValue)
    })

    it("can store non-proxiable values", () => {
      const todos = new Map()
      todos.set(1, "Learn Arbor")
      todos.set(2, "Implement OST")

      const newTodoValue = "Learn LLM"
      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.set(3, newTodoValue)

      expect(ost.root.todos.size).toEqual(3)
      expect(ost.root.todos.get(3)).toBe(newTodoValue)
    })

    it("notifies subscribers of a new item in the array", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.set(3, newTodoValue)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      return new Promise((resolve) => {
        const newTodoValue = { id: 3, content: "Learn LLM" }

        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([3, newTodoValue])
          expect(event.metadata.operation).toEqual("set")
          resolve(true)
        })

        ost.root.todos.set(3, newTodoValue)
      })
    })
  })

  describe("#get", () => {
    it("returns the value of the key", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Map()
      todos.set(1, todo1)
      todos.set(2, todo2)

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.get(1).$value).toBe(todo1)
      expect(ost.root.todos.get(2).$value).toBe(todo2)
    })

    it("caches the node representing the map item", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Map()
      todos.set(1, todo1)
      todos.set(2, todo2)

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.get(1)).toBe(ost.root.todos.get(1))
      expect(ost.root.todos.get(2)).toBe(ost.root.todos.get(2))
    })
  })

  describe("#delete", () => {
    it("mutates the underlying value", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.delete(2)

      expect(ost.root.todos.size).toEqual(1)
      expect(ost.root.todos.get(2)).toBeUndefined()
    })

    it("notifies subscribers of a new item in the array", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.delete(2)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("does not notify subscribers if deleted key does not exist in the map", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.delete(3)

      expect(subscriber).not.toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([2])
          expect(event.metadata.operation).toEqual("delete")
          resolve(true)
        })

        ost.root.todos.delete(2)
      })
    })
  })

  describe("#clear", () => {
    it("mutates the underlying value", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.clear()

      expect(ost.root.todos.size).toEqual(0)
      expect(ost.root.todos.get(1)).toBeUndefined()
      expect(ost.root.todos.get(2)).toBeUndefined()
    })

    it("notifies subscribers of a new item in the array", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.clear()

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("does not notify subscribers if map is already empty", () => {
      const todos = new Map()

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.clear()

      expect(subscriber).not.toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([])
          expect(event.metadata.operation).toEqual("clear")
          resolve(true)
        })

        ost.root.todos.clear()
      })
    })
  })

  describe("#entries", () => {
    it("returns an iterator that exposes the key and node pair held by the map node", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.entries()

      expect(iterator.next().value).toEqual([1, ost.root.todos.get(1)])
      expect(iterator.next().value).toEqual([2, ost.root.todos.get(2)])
      expect(iterator.next().done).toBe(true)
    })

    it("lazily creates nodes for entries accessed", () => {
      const todos = new Map()
      const todo1 = { id: 1, content: "Learn Arbor" }
      todos.set(1, todo1)
      const todo2 = { id: 2, content: "Implement OST" }
      todos.set(2, todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.entries()

      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).toHaveNodeFor(todo2)
    })
  })

  describe("#forEach", () => {
    it("iterates over the entries of the map", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      const entries = []
      ost.root.todos.forEach((value, key, map) => {
        entries.push({ value, key })
        expect(map).toBe(ost.root.todos)
      })

      expect(entries[0].value).toEqual(ost.root.todos.get(1))
      expect(entries[0].key).toEqual(1)
      expect(entries[1].value).toEqual(ost.root.todos.get(2))
      expect(entries[1].key).toEqual(2)
    })
  })

  describe("#has", () => {
    it("returns true if the given key exists in the map", () => {
      const todos = new Map()
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      todos.set(1, todo1)
      todos.set(2, todo2)

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.has(1)).toBe(true)
      expect(ost.root.todos.has(2)).toBe(true)
      expect(ost.root.todos.has(3)).toBe(false)
    })
  })

  describe("keys", () => {
    it("returns an iterator over the keys of the map", () => {
      const todos = new Map()
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      todos.set(1, todo1)
      todos.set(2, todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.keys()
      expect(iterator.next().value).toEqual(1)
      expect(iterator.next().value).toEqual(2)
      expect(iterator.next().done).toBe(true)
    })
  })

  describe("values", () => {
    it("returns an iterator over the node values of the map", () => {
      const todos = new Map()
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      todos.set(1, todo1)
      todos.set(2, todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.values()
      expect(iterator.next().value).toBe(ost.root.todos.get(1))
      expect(iterator.next().value).toBe(ost.root.todos.get(2))
      expect(iterator.next().done).toBe(true)
    })

    it("lazily creates nodes for entries accessed", () => {
      const todos = new Map()
      const todo1 = { id: 1, content: "Learn Arbor" }
      todos.set(1, todo1)
      const todo2 = { id: 2, content: "Implement OST" }
      todos.set(2, todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.values()

      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).toHaveNodeFor(todo2)
    })
  })

  describe("#Symbol.iterator", () => {
    it("returns an iterator that exposes the key and node pair held by the map node", () => {
      const todos = new Map()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos[Symbol.iterator]()

      expect(iterator.next().value).toEqual([1, ost.root.todos.get(1)])
      expect(iterator.next().value).toEqual([2, ost.root.todos.get(2)])
      expect(iterator.next().done).toBe(true)
    })

    it("lazily creates nodes for entries accessed", () => {
      const todos = new Map()
      const todo1 = { id: 1, content: "Learn Arbor" }
      todos.set(1, todo1)
      const todo2 = { id: 2, content: "Implement OST" }
      todos.set(2, todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos[Symbol.iterator]()

      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).toHaveNodeFor(todo2)
    })
  })

  describe("custom @node maps", () => {
    @node
    class MyMap extends Map {
      get first() {
        return this.values().next().value
      }

      get last() {
        let lastTodo = null

        for (const todo of this.values()) {
          lastTodo = todo
        }

        return lastTodo
      }

      deleteLast() {
        this.delete(this.last.id)
      }
    }

    it("supports custom Map types when decorated with @node", () => {
      const todos = new MyMap()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      expect(ost).not.toHaveNodeFor(todos.get(1))
      expect(ost).not.toHaveNodeFor(todos.get(2))

      const iterator = ost.root.todos[Symbol.iterator]()

      iterator.next()

      expect(ost).toHaveNodeFor(todos.get(1))
      expect(ost).not.toHaveNodeFor(todos.get(2))

      iterator.next()

      expect(ost).toHaveNodeFor(todos.get(1))
      expect(ost).toHaveNodeFor(todos.get(2))

      expect(ost.root.todos.first).toBe(ost.root.todos.get(1))
    })

    it("executes custom methods within the context of the proxy", () => {
      const todos = new MyMap()
      todos.set(1, { id: 1, content: "Learn Arbor" })
      todos.set(2, { id: 2, content: "Implement OST" })

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.deleteLast()

      expect(ost.root.todos.size).toBe(1)
      expect(ost.root.todos.last).toBe(ost.root.todos.get(1))
    })
  })

  it("handles mutations to items within the map", () => {
    const ost = new OST(
      new Map([
        [0, { a: 1, b: 2 }],
        [1, { a: 2, b: 3 }],
      ])
    )

    const subscriber = vi.fn()
    ost.subscribe(subscriber)

    ost.root.get(0).a = 2
    ost.root.get(0).a = 1

    expect(subscriber).toHaveBeenCalledTimes(2)
  })
})
