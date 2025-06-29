/* eslint-disable @typescript-eslint/no-explicit-any */
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

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([[newTodo1, newTodo2]])
          expect(event.metadata.operation).toEqual("push")
          resolve(true)
        })

        ost.root.todos.push(newTodo1, newTodo2)
      })
    })
  })

  describe("#pop", () => {
    it("mutates the underlying value", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const state = {
        todos: [todo1, todo2],
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
        todos: [todo1, todo2],
      }

      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([])
          expect(event.metadata.operation).toEqual("pop")
          resolve(true)
        })

        ost.root.todos.pop()
      })
    })
  })

  describe("#shift", () => {
    it("mutates the underlying value", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const state = {
        todos: [todo1, todo2],
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
        todos: [todo1, todo2],
      }

      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([])
          expect(event.metadata.operation).toEqual("shift")
          resolve(true)
        })

        ost.root.todos.shift()
      })
    })
  })

  describe("#unshift", () => {
    it("mutates the underlying value", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todo3 = { id: 3, content: "Write tests" }
      const todo4 = { id: 4, content: "Refactor code" }
      const state = {
        todos: [todo1, todo2],
      }

      const ost = new OST(state)
      const length = ost.root.todos.unshift(todo3, todo4)

      expect(length).toEqual(4)
      expect(state.todos.length).toEqual(4)
      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)
      expect(ost).not.toHaveNodeFor(todo3)
      expect(ost).not.toHaveNodeFor(todo4)
      expect(ost).toHaveNodeValuePair([ost.root.todos[0], todo3])
      expect(ost).toHaveNodeValuePair([ost.root.todos[1], todo4])
      expect(ost).toHaveNodeValuePair([ost.root.todos[2], todo1])
      expect(ost).toHaveNodeValuePair([ost.root.todos[3], todo2])
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
      ost.root.todos.unshift({ id: 3, content: "Write tests" })

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todo3 = { id: 3, content: "Write tests" }
      const todo4 = { id: 4, content: "Refactor code" }
      const state = {
        todos: [todo1, todo2],
      }

      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([[todo3, todo4]])
          expect(event.metadata.operation).toEqual("unshift")
          resolve(true)
        })

        ost.root.todos.unshift(todo3, todo4)
      })
    })
  })

  describe("#reverse", () => {
    it("mutates the underlying value", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const state = {
        todos: [todo1, todo2],
      }

      const ost = new OST(state)
      const $todos = ost.root.todos.reverse()

      expect($todos).toBe(ost.root.todos)
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
      ost.root.todos.reverse()

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const state = {
        todos: [todo1, todo2],
      }

      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.operation).toEqual("reverse")
          expect(event.metadata.args).toEqual([])
          resolve(true)
        })

        ost.root.todos.reverse()
      })
    })
  })

  describe("#filter", () => {
    it("selects nodes based on a predicate", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      const selected = ost.root.todos.filter((t) => t.content.includes("Arbor"))

      expect(selected.length).toEqual(2)
      expect(selected[0]).toBe(ost.root.todos[0])
      expect(selected[1]).toBe(ost.root.todos[2])
    })
  })

  describe("#copyWithin", () => {
    it("mutates the underlying value", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      const copied = ost.root.todos.copyWithin(1, 1, 2)

      expect(copied.length).toEqual(3)
      expect(copied).toBe(ost.root.todos)
    })

    it("notifies subscribers of a new item in the array", () => {
      const subscriber = vi.fn()
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      ost.subscribe(subscriber)

      ost.root.todos.copyWithin(1, 1, 2)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.operation).toEqual("copyWithin")
          expect(event.metadata.args).toEqual([1, 1, 2])
          resolve(true)
        })

        ost.root.todos.copyWithin(1, 1, 2)
      })
    })
  })

  describe("#splice", () => {
    it("mutates the underlying value", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const todo4 = { content: "New todo 1" }
      const todo5 = { content: "New todo 2" }

      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      const spliced = ost.root.todos.splice(1, 1, todo4, todo5)

      expect(spliced).toEqual([{ content: "Do the dishes" }])
      expect(ost.root.todos.$value).toEqual([todo1, todo4, todo5, todo3])
    })

    it("notifies subscribers of a new item in the array", () => {
      const subscriber = vi.fn()
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const todo4 = { content: "New todo 1" }
      const todo5 = { content: "New todo 2" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      ost.subscribe(subscriber)

      ost.root.todos.splice(1, 1, todo4, todo5)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const todo4 = { content: "New todo 1" }
      const todo5 = { content: "New todo 2" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.operation).toEqual("splice")
          expect(event.metadata.args).toEqual([1, 1, [todo4, todo5]])
          resolve(true)
        })

        ost.root.todos.splice(1, 1, todo4, todo5)
      })
    })
  })

  describe("#fill", () => {
    it("mutates the underlying value", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const todo4 = { content: "New todo 1" }

      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      const filled = ost.root.todos.fill(todo4, 1, 3)

      expect(filled).toBe(ost.root.todos)
      expect(ost).toHaveNodeValuePair([ost.root.todos[0], todo1])
      expect(ost).toHaveNodeValuePair([ost.root.todos[1], todo4])
      expect(ost).toHaveNodeValuePair([ost.root.todos[2], todo4])
      expect(ost.root.todos[3]).toBeUndefined()
    })

    it("notifies subscribers of a new item in the array", () => {
      const subscriber = vi.fn()
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const todo4 = { content: "New todo 1" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      ost.subscribe(subscriber)

      ost.root.todos.fill(todo4, 1, 3)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const todo4 = { content: "New todo 1" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.operation).toEqual("fill")
          expect(event.metadata.args).toEqual([todo4, 1, 3])
          resolve(true)
        })

        ost.root.todos.fill(todo4, 1, 3)
      })
    })
  })

  describe("#at", () => {
    it("returns the node item at the given position", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      const node = ost.root.todos.at(1)

      expect(node).toBe(ost.root.todos[1])
    })
  })

  describe("#find", () => {
    it("finds the node item by the given predicate", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const todo3 = { content: "Implement Arbor OST" }
      const ost = new OST({
        todos: [todo1, todo2, todo3],
      })

      const node = ost.root.todos.find((t) => t.content.startsWith("Do "))

      expect(node).toBe(ost.root.todos[1])
    })

    it("returns OST node wrapper instead of raw value", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const found = ost.root.todos.find((t) => t.content.startsWith("Do "))

      expect(found).not.toBe(todo2) // Should not be the raw value
      expect(ost).toHaveNodeValuePair([found, todo2]) // Should be OST node wrapping the value
      expect(found).toBe(ost.root.todos[1]) // Should be the same OST node
    })

    it("predicate receives OST node wrappers as arguments", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const predicateArgs: any[] = []
      ost.root.todos.find((item, index, array) => {
        predicateArgs.push({ item, index, array })
        return false
      })

      expect(predicateArgs).toHaveLength(2)
      expect(predicateArgs[0].item).toBe(ost.root.todos[0]) // OST node
      expect(predicateArgs[0].item.$value).toBe(todo1) // Raw value
      expect(predicateArgs[0].index).toBe(0)
      expect(predicateArgs[0].array).toBe(ost.root.todos)
      expect(predicateArgs[1].item).toBe(ost.root.todos[1]) // OST node
      expect(predicateArgs[1].item.$value).toBe(todo2) // Raw value
      expect(predicateArgs[1].index).toBe(1)
      expect(predicateArgs[1].array).toBe(ost.root.todos)
    })
  })

  describe("#forEach", () => {
    it("iterates over OST node wrappers instead of raw values", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const iteratedItems: any[] = []
      ost.root.todos.forEach((item, index, array) => {
        iteratedItems.push({ item, index, array })
      })

      expect(iteratedItems).toHaveLength(2)
      expect(iteratedItems[0].item).toBe(ost.root.todos[0]) // OST node
      expect(iteratedItems[0].item.$value).toBe(todo1) // Raw value
      expect(iteratedItems[0].index).toBe(0)
      expect(iteratedItems[0].array).toBe(ost.root.todos)
      expect(iteratedItems[1].item).toBe(ost.root.todos[1]) // OST node
      expect(iteratedItems[1].item.$value).toBe(todo2) // Raw value
      expect(iteratedItems[1].index).toBe(1)
      expect(iteratedItems[1].array).toBe(ost.root.todos)
    })
  })

  describe("#map", () => {
    it("provides OST node wrappers to mapper function", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const mappedItems: any[] = []
      const result = ost.root.todos.map((item, index, array) => {
        mappedItems.push({ item, index, array })
        return item.content.toUpperCase()
      })

      expect(mappedItems).toHaveLength(2)
      expect(mappedItems[0].item).toBe(ost.root.todos[0]) // OST node
      expect(mappedItems[0].item.$value).toBe(todo1) // Raw value
      expect(mappedItems[1].item).toBe(ost.root.todos[1]) // OST node
      expect(mappedItems[1].item.$value).toBe(todo2) // Raw value
      expect(result).toEqual(["LEARN ARBOR", "DO THE DISHES"])
    })
  })

  describe("#some", () => {
    it("provides OST node wrappers to predicate function", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const predicateArgs: any[] = []
      const result = ost.root.todos.some((item, index, array) => {
        predicateArgs.push({ item, index, array })
        return item.content.includes("dishes")
      })

      expect(result).toBe(true)
      expect(predicateArgs).toHaveLength(2)
      expect(predicateArgs[0].item).toBe(ost.root.todos[0]) // OST node
      expect(predicateArgs[1].item).toBe(ost.root.todos[1]) // OST node
    })
  })

  describe("#every", () => {
    it("provides OST node wrappers to predicate function", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const predicateArgs: any[] = []
      const result = ost.root.todos.every((item, index, array) => {
        predicateArgs.push({ item, index, array })
        return typeof item.content === "string"
      })

      expect(result).toBe(true)
      expect(predicateArgs).toHaveLength(2)
      expect(predicateArgs[0].item).toBe(ost.root.todos[0]) // OST node
      expect(predicateArgs[1].item).toBe(ost.root.todos[1]) // OST node
    })
  })

  describe("#findIndex", () => {
    it("provides OST node wrappers to predicate function", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const predicateArgs: any[] = []
      const result = ost.root.todos.findIndex((item, index, array) => {
        predicateArgs.push({ item, index, array })
        return item.content.includes("dishes")
      })

      expect(result).toBe(1)
      expect(predicateArgs).toHaveLength(2)
      expect(predicateArgs[0].item).toBe(ost.root.todos[0]) // OST node
      expect(predicateArgs[1].item).toBe(ost.root.todos[1]) // OST node
    })
  })

  describe("#reduce", () => {
    it("provides OST node wrappers to reducer function", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const reducerArgs: any[] = []
      const result = ost.root.todos.reduce((acc, item, index, array) => {
        reducerArgs.push({ acc, item, index, array })
        return acc + item.content.length
      }, 0)

      expect(result).toBe(todo1.content.length + todo2.content.length)
      expect(reducerArgs).toHaveLength(2)
      expect(reducerArgs[0].item).toBe(ost.root.todos[0]) // OST node
      expect(reducerArgs[1].item).toBe(ost.root.todos[1]) // OST node
    })
  })

  describe("#Symbol.iterator", () => {
    it("yields OST node wrappers instead of raw values", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const items = [...ost.root.todos]

      expect(items).toHaveLength(2)
      expect(items[0]).toBe(ost.root.todos[0]) // OST node
      expect(items[0].$value).toBe(todo1) // Raw value
      expect(items[1]).toBe(ost.root.todos[1]) // OST node
      expect(items[1].$value).toBe(todo2) // Raw value
    })

    it("works with for...of loops", () => {
      const todo1 = { content: "Learn Arbor" }
      const todo2 = { content: "Do the dishes" }
      const ost = new OST({
        todos: [todo1, todo2],
      })

      const items: any[] = []
      for (const item of ost.root.todos) {
        items.push(item)
      }

      expect(items).toHaveLength(2)
      expect(items[0]).toBe(ost.root.todos[0]) // OST node
      expect(items[1]).toBe(ost.root.todos[1]) // OST node
    })
  })
})
