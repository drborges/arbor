import { describe, expect, it, vi } from "vitest"

import { $ } from "../../src/types"
import { OST } from "../../src/ost"
import { node } from "../../src/decorators/node"
import { DetachedPathError } from "../../src/errors"
import { detached } from "../../src/decorators/detached"

describe("$object", () => {
  describe("get trap", () => {
    it("lazily creates nodes in the OST as parts of the state are accessed", () => {
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

    it("executes getters within the context of the proxy", () => {
      const state = {
        get lastTodo() {
          return this.todos.at(-1)
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

      const todo2 = state.todos[1]
      const ost = new OST(state)

      expect(ost.root.lastTodo).toBe(ost.nodeOf(todo2))
    })

    it("allows using classes decorated with @node as nodes in the OST", () => {
      @node
      class Todo {
        constructor(public id: number, public content: string) {}
      }

      @node
      class Todos extends Array<Todo> {}

      const todo1 = new Todo(1, "Learn Arbor")
      const todo2 = new Todo(2, "Implement OST")
      const todos = new Todos(todo1, todo2)

      const ost = new OST({
        todos,
      })

      expect(ost.root.todos).toBeInstanceOf(Todos)
      expect(ost.root.todos).toBe(ost.nodeOf(todos))
      expect(ost.root.todos[0]).toBeInstanceOf(Todo)
      expect(ost.root.todos[0]).toBe(ost.nodeOf(todo1))
      expect(ost.root.todos[1]).toBeInstanceOf(Todo)
      expect(ost.root.todos[1]).toBe(ost.nodeOf(todo2))
    })

    it("binds class methods to the proxy itself", () => {
      @node
      class Todo {
        constructor(public id: number, public content: string) {}
      }

      @node
      class Todos extends Array<Todo> {
        getLast() {
          return this.at(-1)
        }
      }

      const todo1 = new Todo(1, "Learn Arbor")
      const todo2 = new Todo(2, "Implement OST")

      const ost = new OST({
        todos: new Todos(todo1, todo2),
      })

      expect(ost.root.todos.getLast()).toBe(ost.nodeOf(todo2))
    })

    it("runs mutations triggered by methods within the context of an OST node", () => {
      @node
      class Todo {
        done = false

        constructor(public content: string) {}

        complete() {
          this.done = true
        }
      }

      @node
      class Todos extends Array<Todo> {
        get incomplete() {
          return this.filter(t => !t.done)
        }
      }

      const ost = new OST({
        todos: new Todos(new Todo("Learn Arbor"), new Todo("Implement OST")),
      })

      const subscriber = vi.fn()
      ost.subscribe(subscriber)

      const incomplete = ost.root.todos.incomplete

      expect(incomplete[0]).toBe(ost.root.todos[0])
      expect(incomplete[1]).toBe(ost.root.todos[1])

      incomplete[0].complete()
      incomplete[1].complete()

      expect(ost).not.toHaveNodeFor(incomplete)
      expect(subscriber).toHaveBeenCalledTimes(2)
    })

    it("does not create nodes for detached object props", () => {
      @node
      class Todo {
        constructor(public id: number, public content: string) {}
      }

      @node
      class TodosApp {
        @detached todo: Todo
      }

      const todo = new Todo(1, "Learn Arbor")
      const ost = new OST(new TodosApp())
      ost.root.todo = todo as $<Todo>

      expect(ost.root.todo).toBe(todo)
      expect(ost.root.todo).not.toBe(ost.nodeOf(todo))
    })
  })

  describe("set trap", () => {
    it("mutates underlying values correctly", () => {
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

      const ost = new OST(state)

      ost.root.todos[0].complete()

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

    it("does not notify subscribers when updating a detached property", () => {
      @node
      class Counter {
        @detached count = 0
      }

      const subscriber = vi.fn()
      const ost = new OST(new Counter())
      ost.subscribe(subscriber)

      ost.root.count++

      expect(subscriber).not.toHaveBeenCalled()
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

      const ost = new OST<typeof state>(state)

      return new Promise((resolve) => {
        ost.root.$subscriptions.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos[0])
          expect(event.metadata.args).toEqual(["done", true])
          expect(event.metadata.operation).toEqual("set")
          resolve(true)
        })

        ost.root.todos[0].complete()
      })
    })

    it("throws DetachedPathError when operating on a detached node", () => {
      const ost = new OST({
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      })

      const $todo1 = ost.root.todos[0]

      delete ost.root.todos[0]

      expect(() => {
        $todo1.content = "Learn Arbor OST"
      }).toThrow(DetachedPathError)
    })
  })

  describe("delete trap", () => {
    it("deletes properties of node correctly", () => {
      const state: { content: string; authorName?: string }[] = [
        { content: "Learn Arbor", authorName: "Alice" },
        { content: "Implement OST", authorName: "Bob" },
      ]

      const ost = new OST(state)

      delete ost.root[0].authorName

      expect(state).toEqual([
        { content: "Learn Arbor" },
        { content: "Implement OST", authorName: "Bob" },
      ])
    })

    it("notifies subscribers about the deletion", () => {
      const state: { content: string; authorName?: string }[] = [
        { content: "Learn Arbor", authorName: "Alice" },
        { content: "Implement OST", authorName: "Bob" },
      ]

      const ost = new OST(state)

      const subscriber1 = vi.fn()
      const subscriber2 = vi.fn()
      const subscriber3 = vi.fn()

      ost.root.$subscriptions.subscribe(subscriber1)
      ost.root[0].$subscriptions.subscribe(subscriber2)
      ost.root[1].$subscriptions.subscribe(subscriber3)

      delete ost.root[0].authorName

      expect(subscriber1).toHaveBeenCalledOnce()
      expect(subscriber2).toHaveBeenCalledOnce()
      expect(subscriber3).not.toHaveBeenCalled()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const state: { content: string; authorName?: string }[] = [
        { content: "Learn Arbor", authorName: "Alice" },
        { content: "Implement OST", authorName: "Bob" },
      ]

      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.root.$subscriptions.subscribe((event) => {
          expect(event.target).toBe(ost.root[0])
          expect(event.metadata.args).toEqual(["authorName"])
          expect(event.metadata.operation).toEqual("delete")
          resolve(true)
        })

        delete ost.root[0].authorName
      })
    })

    it("does not notify subscribers when deleting a detached property", () => {
      @node
      class Counter {
        @detached count?: number = 0
      }

      const subscriber = vi.fn()
      const ost = new OST(new Counter())
      ost.subscribe(subscriber)

      delete ost.root.count

      expect(subscriber).not.toHaveBeenCalled()
      expect(ost.root.count).toBeUndefined()
    })

    it("throws a DetachedPathError when mutating a detached node", () => {
      const state: { content: string; authorName?: string }[] = [
        { content: "Learn Arbor", authorName: "Alice" },
        { content: "Implement OST", authorName: "Bob" },
      ]

      const ost = new OST(state)

      const $todo1 = ost.root[0]

      delete ost.root[0]

      expect(() => {
        delete $todo1.authorName
      }).toThrow(DetachedPathError)
    })
  })

  describe("#$children", () => {
    it("creates children nodes when iterating over them", () => {
      const ost = new OST({
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      })

      for (const child of ost.root.todos.$children()) {
        expect(child).toBe(ost.nodeOf(child.$value))
      }
    })
  })

  describe("Symbol.toStringTag", () => {
    it("returns the string representation of the object node", () => {
      const ost = new OST([
        { content: "Learn Arbor", authorName: "Alice" },
      ])

      const $node1 = ost.root
      const $node2 = ost.root[0]

      expect($node1[Symbol.toStringTag]).toBe(`ArborNode<Array(${$node1.$seed.value})>`)
      expect($node2[Symbol.toStringTag]).toBe(`ArborNode<Object(${$node2.$seed.value})>`)
    })

    it("handle custom types", () => {
      @node
      class Todo {
        constructor(public content: string) {}
      }

      @node
      class Todos extends Array<Todo> {}

      const ost = new OST(new Todos(new Todo("Learn Arbor")))

      const $node1 = ost.root
      const $node2 = ost.root[0]

      expect($node1[Symbol.toStringTag]).toBe(`ArborNode<Todos(${$node1.$seed.value})>`)
      expect($node2[Symbol.toStringTag]).toBe(`ArborNode<Todo(${$node2.$seed.value})>`)
    })
  })
})
