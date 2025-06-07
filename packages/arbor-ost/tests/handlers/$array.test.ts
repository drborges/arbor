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
    it("selects nodes based on a predicate", () => {
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
})
