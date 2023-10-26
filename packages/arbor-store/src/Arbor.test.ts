/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-classes-per-file */
import { Arbor, ImmutableArbor } from "./Arbor"
import { Path } from "./Path"
import { Seed } from "./Seed"
import { ArborProxiable, detached, proxiable } from "./decorators"
import {
  ArborError,
  DetachedNodeError,
  NotAnArborNodeError,
  ValueAlreadyBoundError,
} from "./errors"
import { ArborNode } from "./types"
import { detach, isDetached, merge, path, unwrap } from "./utilities"

import { isTracked, track, unwrapTrackedNode } from "./tracking"

describe("ImmutableArbor", () => {
  describe("Example: State Tree and Structural Sharing", () => {
    it("generates a new state tree by reusing nodes unaffected by the mutation (structural sharing)", () => {
      const store = new ImmutableArbor({
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
        users: [{ name: "Alice" }, { name: "Bob" }],
      })

      const root = store.state
      const todos = store.state.todos
      const todo0 = store.state.todos[0]
      const todo1 = store.state.todos[1]
      const users = store.state.users
      const user0 = store.state.users[0]
      const user1 = store.state.users[1]

      todo0.text = "Clean the living room"

      expect(store.state).not.toBe(root)
      expect(store.state.todos).not.toBe(todos)
      expect(store.state.todos[0]).not.toBe(todo0)
      expect(store.state.todos[1]).toBe(todo1)
      expect(store.state.users).toBe(users)
      expect(store.state.users[0]).toBe(user0)

      expect(store.state.users[1]).toBe(user1)
    })

    it("generates a applies structure sharing to the data stored in the state tree creating snapshots of the data on each mutation", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
        users: [{ name: "Alice" }, { name: "Bob" }],
      }

      const store = new ImmutableArbor(state)

      const todos = state.todos
      const todo0 = state.todos[0]
      const todo1 = state.todos[1]
      const users = state.users
      const user0 = state.users[0]
      const user1 = state.users[1]

      store.state.todos[0].text = "Clean the living room"

      expect(unwrap(store.state)).not.toBe(state)
      expect(unwrap(store.state.todos)).not.toBe(todos)
      expect(unwrap(store.state.todos[0])).not.toBe(todo0)
      expect(unwrap(store.state.todos[1])).toBe(todo1)
      expect(unwrap(store.state.users)).toBe(users)
      expect(unwrap(store.state.users[0])).toBe(user0)
      expect(unwrap(store.state.users[1])).toBe(user1)
    })

    it("traversing detached nodes does not 'bring' them back into the state tree", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      }

      const store = new ImmutableArbor(state)

      const todos = store.state.todos

      delete store.state.todos[0]

      // todos[0] should still exist in the previous snapshot
      expect(todos.length).toEqual(2)
      expect(unwrap(todos[0])).toBe(state.todos[0])

      expect(store.state).toEqual({ todos: [{ text: "Walk the dogs" }] })
      expect(store.state.todos).toEqual([{ text: "Walk the dogs" }])
      expect(store.state.todos[0]).toEqual({ text: "Walk the dogs" })

      expect(unwrap(store.state)).toEqual({
        todos: [{ text: "Walk the dogs" }],
      })
      expect(unwrap(store.state.todos)).toEqual([{ text: "Walk the dogs" }])
      expect(unwrap(store.state.todos[0])).toEqual({ text: "Walk the dogs" })
    })

    it("operates on the same snapshot when triggering subsequent mutations on the same node reference", () => {
      const store = new ImmutableArbor({
        count: 0,
      })

      const counter = store.state
      counter.count++
      counter.count++

      expect(store.state.count).toBe(1)
    })

    it("does not bring detached nodes back when they are mutated", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      }

      const store = new ImmutableArbor(state)

      const todo0 = store.root.todos[0]

      delete store.root.todos[0]

      expect(() => {
        todo0.text = "No longer in the state tree"
      }).toThrow(DetachedNodeError)
      expect(store.root).toEqual({
        todos: [{ text: "Walk the dogs" }],
      })
    })

    it("allows having sibling nodes with the same value", () => {
      const store = new ImmutableArbor({
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      })

      const todo0Node = store.root.todos[0]
      const todo1Node = store.root.todos[1]

      store.root.todos[0] = todo1Node

      expect(store.root.todos[0]).not.toBe(todo1Node)
      expect(store.root.todos[1]).not.toBe(todo1Node)
      expect(unwrap(store.root.todos[0])).toBe(unwrap(todo1Node))
      expect(unwrap(store.root.todos[1])).toBe(unwrap(todo1Node))
      expect(store.getNodeFor(todo0Node)).toBe(undefined)
      expect(store.root).toEqual({
        todos: [{ text: "Walk the dogs" }, { text: "Walk the dogs" }],
      })
    })

    it("accounts for nodes changing location in the state tree", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      }

      const store = new ImmutableArbor(state)

      const todo0 = state.todos[0]
      const todo1 = state.todos[1]
      const todo0Node = store.root.todos[0]
      const todo1Node = store.root.todos[1]

      store.root.todos[0] = todo1Node
      store.root.todos[1] = todo0Node

      expect(unwrap(store.root.todos)).toEqual([
        { text: "Walk the dogs" },
        { text: "Clean the house" },
      ])

      expect(unwrap(store.root.todos[0])).toBe(todo1)
      expect(unwrap(store.root.todos[1])).toBe(todo0)
      expect(todo1Node.text).toEqual("Walk the dogs")
      expect(store.root.todos[0].text).toEqual("Walk the dogs")
      expect(store.root.todos[1].text).toEqual("Clean the house")

      todo1Node.text = "Walk the dogs updated"

      expect(todo1Node.text).toEqual("Walk the dogs")
      expect(store.root.todos[0].text).toEqual("Walk the dogs updated")
      expect(store.root.todos[1].text).toEqual("Clean the house")
      expect(unwrap(store.root.todos)).toEqual([
        { text: "Walk the dogs updated" },
        { text: "Clean the house" },
      ])

      todo0Node.text = "Clean the house updated"

      expect(todo0Node.text).toEqual("Clean the house")
      expect(todo1Node.text).toEqual("Walk the dogs")
      expect(store.root.todos[0].text).toEqual("Walk the dogs updated")
      expect(store.root.todos[1].text).toEqual("Clean the house updated")
      expect(unwrap(store.root.todos)).toEqual([
        { text: "Walk the dogs updated" },
        { text: "Clean the house updated" },
      ])
    })

    it("can update stale item references that were moved into new positions within the array", () => {
      const store = new ImmutableArbor([
        { text: "Clean the house", done: false },
        { text: "Do the dishes", done: false },
      ])

      const todo0 = store.state[0]
      const todo1 = store.state[1]

      store.state[0] = todo1
      store.state[1] = todo0

      expect(store.getNodeFor(todo0)).toBeDefined()

      todo0.done = true

      expect(store.state[0].done).toBe(false)
      expect(store.state[1].done).toBe(true)
      expect(unwrap(store.state[0])).toBe(unwrap(todo1))
      expect(unwrap(store.state[1])).not.toBe(unwrap(todo0))
    })
  })
})

describe("Arbor", () => {
  describe("Example: State Tree and Structural Sharing", () => {
    it("generates a new state tree by reusing nodes unaffected by the mutation (structural sharing)", () => {
      const store = new Arbor({
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
        users: [{ name: "Alice" }, { name: "Bob" }],
      })

      const root = store.state
      const todos = store.state.todos
      const todo0 = store.state.todos[0]
      const todo1 = store.state.todos[1]
      const users = store.state.users
      const user0 = store.state.users[0]
      const user1 = store.state.users[1]

      todo0.text = "Clean the living room"

      expect(store.state).not.toBe(root)
      expect(store.state.todos).not.toBe(todos)
      expect(store.state.todos[0]).not.toBe(todo0)
      expect(store.state.todos[1]).toBe(todo1)
      expect(store.state.users).toBe(users)
      expect(store.state.users[0]).toBe(user0)
      expect(store.state.users[1]).toBe(user1)
    })

    it("ensures stale node references are also updated", () => {
      const store = new Arbor({
        count: 0,
      })

      const counter = store.state
      const subscriber = jest.fn()
      store.subscribe(subscriber)

      counter.count++

      expect(counter.count).toBe(1)
      expect(store.state.count).toBe(1)
      expect(subscriber.mock.calls[0][0].state.count).toBe(1)

      counter.count++

      expect(counter.count).toBe(2)
      expect(store.state.count).toBe(2)
      expect(subscriber.mock.calls[1][0].state.count).toBe(2)
    })

    it("traversing detached nodes does not 'bring' them back into the state tree", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      }

      const store = new Arbor(state)

      const todos = store.state.todos

      delete store.state.todos[0]

      // todos[0] should still exist in the previous snapshot
      expect(todos[0]).toBeDefined()
      expect(unwrap(todos[0])).toBe(state.todos[0])

      expect(store.state).toEqual({ todos: [{ text: "Walk the dogs" }] })
      expect(store.state.todos).toEqual([{ text: "Walk the dogs" }])
      expect(store.state.todos[0]).toEqual({ text: "Walk the dogs" })

      expect(unwrap(store.state)).toEqual({
        todos: [{ text: "Walk the dogs" }],
      })
      expect(unwrap(store.state.todos)).toEqual([{ text: "Walk the dogs" }])
      expect(unwrap(store.state.todos[0])).toEqual({ text: "Walk the dogs" })
    })

    it("accounts for nodes changing location in the state tree", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      }

      const store = new Arbor(state)

      const todo0 = state.todos[0]
      const todo1 = state.todos[1]
      const todo0Node = store.root.todos[0]
      const todo1Node = store.root.todos[1]

      store.root.todos[0] = todo1Node
      store.root.todos[1] = todo0Node

      expect(unwrap(store.root.todos)).toEqual([
        { text: "Walk the dogs" },
        { text: "Clean the house" },
      ])

      expect(unwrap(store.root.todos[0])).toBe(todo1)
      expect(unwrap(store.root.todos[1])).toBe(todo0)
      expect(todo1Node.text).toEqual("Walk the dogs")
      expect(store.root.todos[0].text).toEqual("Walk the dogs")
      expect(store.root.todos[1].text).toEqual("Clean the house")

      todo1Node.text = "Walk the dogs updated"

      expect(todo1Node.text).toEqual("Walk the dogs updated")
      expect(store.root.todos[0].text).toEqual("Walk the dogs updated")
      expect(store.root.todos[1].text).toEqual("Clean the house")
      expect(unwrap(store.root.todos)).toEqual([
        { text: "Walk the dogs updated" },
        { text: "Clean the house" },
      ])

      todo0Node.text = "Clean the house updated"

      expect(todo0Node.text).toEqual("Clean the house updated")
      expect(todo1Node.text).toEqual("Walk the dogs updated")
      expect(store.root.todos[0].text).toEqual("Walk the dogs updated")
      expect(store.root.todos[1].text).toEqual("Clean the house updated")
      expect(unwrap(store.root.todos)).toEqual([
        { text: "Walk the dogs updated" },
        { text: "Clean the house updated" },
      ])
    })

    it("automatically detaches a node when its value is replaced with another node", () => {
      const store = new Arbor({
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      })

      const todo0Node = store.root.todos[0]
      const todo1Node = store.root.todos[1]

      store.root.todos[0] = todo1Node

      expect(
        () => (todo0Node.text = "this update should throw an error")
      ).toThrow(DetachedNodeError)
    })

    it("allows for sibling paths to point to the same node", () => {
      const store = new Arbor({
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      })

      const todo1Node = store.root.todos[1]

      store.root.todos[0] = todo1Node

      expect(store.root.todos[0]).toBe(store.root.todos[1])
      expect(store.root).toEqual({
        todos: [{ text: "Walk the dogs" }, { text: "Walk the dogs" }],
      })
    })

    it("keeps stale node references in sync with the current state tree", () => {
      const store = new Arbor({
        counter: {
          count: 0,
        },
      })

      const counter = store.state.counter

      // Mutates the state tree path /counter via the node reference "counter"
      counter.count++
      // Triggers another mutation against the state tree path /counter
      // via a different reference, causing Arbor to create a new state tree and
      // rendering the "counter" reference "stale", e.g, it's a node belonging to
      // a previous state tree version.
      store.state.counter.count++

      // Arbor can still keep the stale reference in sync with the state tree updates
      expect(counter.count).toBe(2)
      // Accessing state tree nodes from the store always yields the
      // current node state
      expect(store.state.counter.count).toBe(2)
    })

    it("Keeps object references when assigning to node properties", () => {
      const store = new Arbor({
        todos: [{ text: "Clean the house" }],
      })

      const todo = { text: "Walk the dogs" }
      store.state.todos[0] = todo

      expect(unwrap(store.state.todos[0])).toBe(todo)
    })

    it("automatically unwrap node values during assignments", () => {
      const alice = { name: "Alice" }
      const bob = { name: "Bob" }
      const store = new Arbor({
        user1: alice,
        user2: bob,
      })

      const aliceNode = store.state.user1

      store.state.user2 = aliceNode

      expect(unwrap(store.state.user2)).toBe(alice)
    })

    it("allows marking node properties as detached to avoid updates", () => {
      @proxiable
      class Todo {
        @detached count = 0

        @detached
        tracker = {
          count: 0,
        }

        constructor(public text: string) {}
      }

      const store = new Arbor([
        new Todo("Clean the house"),
        new Todo("Walk the dogs"),
      ])

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state[0].count++
      store.state[0].tracker.count++
      store.state[0].tracker = { count: 4 }

      expect(subscriber).not.toHaveBeenCalled()
    })

    it("subscribes to changes to the root of the state tree", () => {
      const store = new Arbor({
        count: 0,
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.setState({ count: 4 })

      expect(subscriber).toHaveBeenCalledTimes(1)
    })
  })

  describe("Example: Subscriptions", () => {
    it("subscribes to any store mutations (any mutations to any node in the state tree)", () => {
      const store = new Arbor([
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ])

      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()

      store.subscribe(subscriber1)
      store.subscribe(subscriber2)

      store.state[0].age++
      store.state.push({ name: "Carol", age: 20 })

      expect(subscriber1).toHaveBeenCalledTimes(2)
      expect(subscriber2).toHaveBeenCalledTimes(2)
    })

    it("subscribes to mutations to a specific state tree node", () => {
      const store = new Arbor([
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ])

      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()
      const subscriber3 = jest.fn()

      store.subscribeTo(store.state, subscriber1)
      store.subscribeTo(store.state[0], subscriber2)
      store.subscribeTo(store.state[1], subscriber3)

      store.state[0].age++
      store.state[1].age++
      store.state.push({ name: "Carol", age: 20 })

      expect(subscriber1).toHaveBeenCalledTimes(3)
      expect(subscriber2).toHaveBeenCalledTimes(1)
      expect(subscriber3).toHaveBeenCalledTimes(1)
    })

    it("does not trigger notifications when mutations are performed on detached nodes", () => {
      const store = new Arbor([
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ])

      const user0 = store.state[0]
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()

      delete store.state[0]

      store.subscribe(subscriber1)
      store.subscribeTo(user0, subscriber2)

      expect(() => user0.age++).toThrow(DetachedNodeError)
      expect(subscriber1).not.toHaveBeenCalled()
      expect(subscriber2).not.toHaveBeenCalled()
    })

    it("ignores assignments when new value is the current value", () => {
      const alice = { name: "Alice" }
      const store = new Arbor({
        user: alice,
      })

      const aliceNode = store.state.user
      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state.user = alice
      store.state.user = aliceNode

      expect(subscriber).not.toHaveBeenCalled()
    })
  })

  describe("Example: Deleting nodes from the state tree", () => {
    it("allows deleting nodes using the 'delete' keyword", () => {
      type Todo = {
        text: string
      }

      type Todos = {
        [key: string]: Todo
      }

      const store = new Arbor<Todos>({
        "1": { text: "Clean the house" },
        "2": { text: "Walk the dogs" },
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      delete store.state["2"]

      expect(store.state["2"]).toBeUndefined()
      expect(subscriber.mock.calls.length).toBe(1)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("delete")
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["2"])
      expect(subscriber.mock.calls[0][0].state).toEqual({
        "1": { text: "Clean the house" },
      })
    })

    it("allows deleting nodes by detaching them from the state tree", () => {
      @proxiable
      class Todo {
        text: string

        constructor(data: Partial<Todo>) {
          Object.assign(this, data)
        }
      }

      type Todos = {
        [key: string]: Todo
      }

      const store = new Arbor<Todos>({
        "1": new Todo({ text: "Clean the house" }),
        "2": new Todo({ text: "Walk the dogs" }),
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      detach(store.state["2"])

      expect(store.state["2"]).toBeUndefined()
      expect(subscriber.mock.calls.length).toBe(1)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("delete")
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["2"])
      expect(subscriber.mock.calls[0][0].state).toEqual({
        "1": { text: "Clean the house" },
      })
    })
  })

  describe("Example: Counter", () => {
    it("keeps track of a counter's state", () => {
      const store = new Arbor({
        count: 0,
      })

      store.state.count++

      expect(store.state.count).toBe(1)
    })

    it("allows subsequent mutations to the same state tree node reference", () => {
      const store = new Arbor({
        count: 0,
      })

      const counter = store.state
      counter.count++
      counter.count++

      expect(store.state.count).toBe(2)
    })

    it("subscribes to store mutations", () => {
      const store = new Arbor({
        count: 0,
      })

      return new Promise((resolve) => {
        store.subscribe((event) => {
          expect(event.mutationPath.isRoot()).toBe(true)
          expect(event.metadata.props).toEqual(["count"])
          expect(event.metadata.operation).toEqual("set")
          expect(event.state).toEqual({ count: -1 })
          resolve(null)
        })

        store.state.count--
      })
    })
  })

  describe("Example: Todo List", () => {
    it("keeps track of a todo list state", () => {
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      store.state.push({ text: "Walk the dogs", status: "done" })

      expect(store.state).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
        { text: "Walk the dogs", status: "done" },
      ])
    })

    it("allows subsequent mutations to the same state tree node reference", () => {
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const todo = store.state[0]
      todo.status = "doing"
      todo.text = "Doing the dishes"

      expect(store.state).toEqual([
        { text: "Doing the dishes", status: "doing" },
        { text: "Clean the house", status: "doing" },
      ])
    })

    it("subscribes to store mutations", () => {
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const todo = store.state[0]

      return new Promise((resolve) => {
        store.subscribe((event) => {
          expect(event.mutationPath.seeds.length).toBe(1)
          expect(event.mutationPath.seeds[0]).toBe(Seed.from(store.state[0]))
          expect(event.metadata.props).toEqual(["status"])
          expect(event.metadata.operation).toEqual("set")
          expect(event.state).toEqual([
            { text: "Do the dishes", status: "doing" },
            { text: "Clean the house", status: "doing" },
          ])

          resolve(null)
        })

        todo.status = "doing"
      })
    })

    it("subscribes to any store mutations", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const todo1 = store.state[0]
      const todo2 = store.state[1]

      store.subscribe(subscriber)

      todo1.status = "doing"
      todo2.status = "done"

      const mutationPath1 = subscriber.mock.calls[0][0].mutationPath as Path
      const mutationPath2 = subscriber.mock.calls[1][0].mutationPath as Path

      expect(subscriber.mock.calls.length).toBe(2)
      expect(mutationPath1.matches(store.state[0])).toBe(true)
      expect(mutationPath2.matches(store.state[1])).toBe(true)
    })

    it("subscribes to mutations on a specific state tree node", () => {
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const todo1 = store.state[0]
      const todo2 = store.state[1]

      store.subscribeTo(todo1, subscriber1)
      store.subscribeTo(todo2, subscriber2)

      todo1.status = "doing"
      todo2.status = "done"

      const mutationPath1 = subscriber1.mock.calls[0][0].mutationPath as Path
      const mutationPath2 = subscriber2.mock.calls[0][0].mutationPath as Path

      expect(subscriber1.mock.calls.length).toBe(1)
      expect(subscriber2.mock.calls.length).toBe(1)
      expect(mutationPath1.matches(store.state[0])).toBe(true)
      expect(mutationPath2.matches(store.state[1])).toBe(true)
    })

    it("mutations cause a new state tree to be generated via structural sharing", () => {
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const root = store.state
      const todo1 = store.state[0]
      const todo2 = store.state[1]

      todo1.status = "doing"

      expect(root).not.toBe(store.state)
      expect(todo1).not.toBe(store.state[0])
      expect(todo2).toBe(store.state[1])
    })
  })

  describe("Example: Business logic encapsulation", () => {
    it("supports encapsulating logic within method definitions", () => {
      const store = new Arbor([
        {
          text: "Do the dishes",
          status: "todo",
          complete() {
            this.status = "done"
          },
        },
      ])

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state[0].complete()

      expect(subscriber).toHaveBeenCalled()
      expect(store.state[0].status).toBe("done")
      expect(store.state[0].complete).toBeDefined()
    })

    it("allows for custom types as long as they are 'ArborProxiable'", () => {
      class Todo {
        [ArborProxiable] = true
        constructor(public text: string, public status = "todo") {}
        complete() {
          this.status = "done"
        }
      }

      const todo = new Todo("Do the dishes")
      const store = new Arbor([todo])
      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state[0].complete()

      expect(subscriber).toHaveBeenCalled()
      expect(store.state[0].status).toBe("done")
      expect(store.state[0].complete).toBeDefined()
    })

    it("marks a custom type as proxiable via decorator", () => {
      @proxiable
      class Todo {
        constructor(public text: string, public status = "todo") {}
        complete() {
          this.status = "done"
        }
      }

      const todo = new Todo("Do the dishes")
      const store = new Arbor([todo])
      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state[0].complete()

      expect(subscriber).toHaveBeenCalled()
      expect(store.state[0].status).toBe("done")
      expect(store.state[0].complete).toBeDefined()
    })

    it("allows using class getters to select nodes within the state tree", () => {
      @proxiable
      class Todo {
        constructor(
          readonly id: number,
          public text: string,
          public active = false
        ) {}
      }

      @proxiable
      class TodoList {
        todos: Todo[] = []

        constructor(...items: Todo[]) {
          items.forEach((item) => {
            this.todos.push(item)
          })
        }

        get activeTodos() {
          return this.todos.filter((todo) => todo.active)
        }
      }

      const store = new Arbor(
        new TodoList(
          new Todo(1, "Do the dishes"),
          new Todo(2, "Learn Arbor", true)
        )
      )

      const activeTodos = store.state.activeTodos

      expect(activeTodos[0].id).toBe(2)
      expect(activeTodos[0].active).toBe(true)
      expect(activeTodos[0].text).toBe("Learn Arbor")
      expect(activeTodos[0]).toBe(store.state.todos[1])
      expect(path(activeTodos[0]).matches(store.state.todos[1])).toBe(true)
    })

    it("allows using object literal getters to select nodes within the state tree", () => {
      type Todo = {
        id: number
        text: string
        active: boolean
      }

      type TodoList = {
        todos: Todo[]
        get activeTodos(): Todo[]
      }

      const todoList: TodoList = {
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Learn Arbor", active: true },
        ] as Todo[],

        get activeTodos() {
          return (this as TodoList).todos.filter((todo) => todo.active)
        },
      }

      const store = new Arbor(todoList)

      const activeTodos = store.state.activeTodos

      expect(activeTodos[0].id).toBe(2)
      expect(activeTodos[0].active).toBe(true)
      expect(activeTodos[0].text).toBe("Learn Arbor")
      expect(activeTodos[0]).toBe(store.state.todos[1])
      expect(path(activeTodos[0]).matches(store.state.todos[1])).toBe(true)
    })

    it("accounts for getters in the prototype chain", () => {
      type Todo = {
        id: string
        text: string
        active: boolean
      }

      class Collection {
        private items = new Map<string, Todo>()

        constructor(...items: Todo[]) {
          items.forEach((item) => {
            this.items.set(item.id, item)
          })
        }

        get all() {
          return Array.from(this.items.values())
        }
      }

      @proxiable
      class Todos extends Collection {
        get activeTodos() {
          return this.all.filter((todo) => todo.active)
        }
      }

      const store = new Arbor(
        new Todos(
          { id: "a", text: "Do the dishes", active: false },
          { id: "b", text: "Learn Arbor", active: true }
        )
      )

      const activeTodos = store.state.activeTodos

      expect(activeTodos[0].id).toBe("b")
      expect(activeTodos[0].active).toBe(true)
      expect(activeTodos[0].text).toBe("Learn Arbor")
      expect(activeTodos[0]).toBe(store.state.all[1])
      expect(path(activeTodos[0]).matches(store.state.all[1])).toBe(true)
    })
  })

  describe("Example: Reactive Array API", () => {
    it("can update stale item references that were moved into new positions within the array", () => {
      const store = new Arbor([
        { text: "Clean the house", done: false },
        { text: "Do the dishes", done: false },
      ])

      const todo0 = store.state[0]
      const todo1 = store.state[1]

      store.state[0] = todo1
      store.state[1] = todo0

      todo0.done = true

      expect(store.state[0].done).toBe(false)
      expect(store.state[1].done).toBe(true)
      expect(unwrap(store.state[0])).toBe(unwrap(todo1))
      expect(unwrap(store.state[1])).toBe(unwrap(todo0))
    })

    it("makes Array#push reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([{ text: "Do the dishes", status: "todo" }])

      store.subscribe(subscriber)
      store.state.push({ text: "Walk the dogs", status: "todo" })

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["1"])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("push")
      expect(subscriber.mock.calls[0][0].state).toBe(store.state)

      expect(store.state).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })

    it("makes Array#splice reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
      ])

      store.subscribe(subscriber)
      store.state.splice(0, 2)

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["0", "1"])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("splice")
      expect(subscriber.mock.calls[0][0].state).toEqual(store.state)
      expect(store.state).toEqual([{ text: "Clean the house", status: "todo" }])
    })

    it("makes 'delete' reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
      ])

      store.subscribe(subscriber)
      delete store.state[0]

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["0"])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("delete")
      expect(subscriber.mock.calls[0][0].state).toEqual(store.state)
      expect(store.state).toEqual([
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
      ])
    })

    it("makes Array#shift reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
      ])

      store.subscribe(subscriber)
      const shiftedTodo = store.state.shift()

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["0"])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("shift")
      expect(subscriber.mock.calls[0][0].state).toEqual(store.state)
      expect(shiftedTodo).toEqual({ text: "Do the dishes", status: "todo" })
      expect(store.state).toEqual([
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
      ])
    })

    it("makes Array#pop reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
      ])

      store.subscribe(subscriber)
      const poppedTodo = store.state.pop()

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["2"])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("pop")
      expect(subscriber.mock.calls[0][0].state).toEqual(store.state)
      expect(poppedTodo).toEqual({ text: "Clean the house", status: "todo" })
      expect(store.state).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })

    it("makes Array#unshift reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])

      store.subscribe(subscriber)
      const length = store.state.unshift({
        text: "Clean the house",
        status: "todo",
      })

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual([])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("unshift")
      expect(subscriber.mock.calls[0][0].state).toEqual(store.state)
      expect(length).toEqual(3)
      expect(store.state).toEqual([
        { text: "Clean the house", status: "todo" },
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })

    it("makes Array#reverse reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])

      store.subscribe(subscriber)
      const reversed = store.state.reverse()

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual([])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("reverse")
      expect(subscriber.mock.calls[0][0].state).toEqual(store.state)
      expect(reversed).toBe(store.state)
      expect(store.state).toEqual([
        { text: "Walk the dogs", status: "todo" },
        { text: "Do the dishes", status: "todo" },
      ])
    })

    it("makes Array#sort reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
        { text: "Do the dishes", status: "todo" },
      ])

      store.subscribe(subscriber)
      const sorted = store.state.sort((a, b) => a.text.localeCompare(b.text))

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual([])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("sort")
      expect(subscriber.mock.calls[0][0].state).toEqual(store.state)
      expect(sorted).toBe(store.state)
      expect(store.state).toEqual([
        { text: "Clean the house", status: "todo" },
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })
  })

  describe("Example: Reactive Map API", () => {
    it("allows tracking nodes stored within Map instances", () => {
      @proxiable
      class Todo {
        constructor(public text: string) {}
      }

      const todosMap = new Map<string, Todo>()
      todosMap.set("123", new Todo("Walk the dogs"))

      const store = new Arbor({
        todos: todosMap,
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state.todos.set("abc", new Todo("Clean the house"))

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.matches(store.state.todos)).toBe(true)
      expect(subscriber).toHaveBeenCalled()
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["abc"])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("set")
      expect(subscriber.mock.calls[0][0].state).toBe(store.state)
      expect(store.state.todos.get("123")).not.toBe(todosMap.get("123"))
      expect(store.state.todos.get("123")).toEqual(new Todo("Walk the dogs"))
      expect(store.state.todos.get("abc")).not.toBe(todosMap.get("abc"))
      expect(store.state.todos.get("abc")).toEqual(new Todo("Clean the house"))
    })

    it("does not trigger mutation if new value is current value", () => {
      const todosMap = new Map<string, { text: string }>()
      todosMap.set("123", { text: "Walk the dogs" })

      const store = new Arbor({
        todos: todosMap,
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state.todos.set("123", todosMap.get("123")!)
      store.state.todos.set("123", store.state.todos.get("123")!)

      expect(subscriber).not.toHaveBeenCalled()
    })

    it("TODO: nodes proxying the same value are conflicting (will have to think more about this)", () => {
      const todosMap = new Map<string, { text: string }>()
      todosMap.set("123", { text: "Walk the dogs" })
      todosMap.set("abc", { text: "Clean the house" })

      const store = new Arbor({
        todos: todosMap,
      })

      expect(() =>
        store.state.todos.set("123", store.state.todos.get("abc")!)
      ).toThrow(ValueAlreadyBoundError)
    })

    it("allows deleting nodes stored within Map instances", () => {
      @proxiable
      class Todo {
        constructor(public text: string) {}
      }

      const todosMap = new Map<string, Todo>()
      todosMap.set("123", new Todo("Walk the dogs"))
      todosMap.set("abc", new Todo("Clean the house"))

      const store = new Arbor({
        todos: todosMap,
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state.todos.delete("abc")

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.matches(store.state.todos)).toBe(true)
      expect(subscriber).toHaveBeenCalled()
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["abc"])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("delete")
      expect(subscriber.mock.calls[0][0].state).toBe(store.state)
      expect(store.state.todos.get("123")).toEqual(new Todo("Walk the dogs"))
      expect(store.state.todos.get("abc")).toBeUndefined()
    })

    it("allows clearing a Map of nodes", () => {
      @proxiable
      class Todo {
        constructor(public text: string) {}
      }

      const todosMap = new Map<string, Todo>()
      todosMap.set("123", new Todo("Walk the dogs"))
      todosMap.set("abc", new Todo("Clean the house"))

      const store = new Arbor({
        todos: todosMap,
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state.todos.clear()

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.matches(store.state.todos)).toBe(true)
      expect(subscriber).toHaveBeenCalled()
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual([])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("clear")
      expect(subscriber.mock.calls[0][0].state).toBe(store.state)
      expect(store.state.todos.get("123")).toBeUndefined()
      expect(store.state.todos.get("abc")).toBeUndefined()
    })

    it("allows iterating over Map values", () => {
      @proxiable
      class Todo {
        constructor(public text: string) {}
      }

      const todosMap = new Map<string, Todo>()
      todosMap.set("123", new Todo("Walk the dogs"))
      todosMap.set("abc", new Todo("Clean the house"))

      const store = new Arbor({
        todos: todosMap,
      })

      const todos = Array.from(store.state.todos.values())

      expect(todos[0]).not.toBe(todosMap.get("123"))
      expect(todos[0]).toBe(store.state.todos.get("123"))
      expect(todos[1]).not.toBe(todosMap.get("abc"))
      expect(todos[1]).toBe(store.state.todos.get("abc"))
    })

    it("allows iterating over Map entries", () => {
      @proxiable
      class Todo {
        constructor(public text: string) {}
      }

      const todosMap = new Map<string, Todo>()
      todosMap.set("123", new Todo("Walk the dogs"))
      todosMap.set("abc", new Todo("Clean the house"))

      const store = new Arbor({
        todos: todosMap,
      })

      const entries = Array.from(store.state.todos.entries())

      expect(entries[0][1]).not.toBe(todosMap.get("123"))
      expect(entries[0][1]).toBe(store.state.todos.get("123"))
      expect(entries[1][1]).not.toBe(todosMap.get("abc"))
      expect(entries[1][1]).toBe(store.state.todos.get("abc"))
    })

    it("allows destructuring a map into an array of entries", () => {
      const todosMap = new Map<string, { text: string }>()
      todosMap.set("123", { text: "Walk the dogs" })
      todosMap.set("abc", { text: "Clean the house" })

      const store = new Arbor({
        todos: todosMap,
      })

      const entries = [...store.state.todos]

      expect(entries[0][0]).toBe("123")
      expect(entries[0][1]).toBe(store.state.todos.get("123"))
      expect(entries[1][0]).toBe("abc")
      expect(entries[1][1]).toBe(store.state.todos.get("abc"))
      expect(entries).toBeInstanceOf(Array)
      expect(entries.length).toBe(2)
    })

    it("can traverse a path including a Map node", () => {
      const todosMap = new Map<string, { text: string }>()
      todosMap.set("123", { text: "Walk the dogs" })
      todosMap.set("abc", { text: "Clean the house" })

      const store = new Arbor({
        todos: todosMap,
      })

      const todo = store.state.todos.get("123")!

      const node = store.getNodeAt(path(todo))

      expect(node).toBe(todo)
    })

    it("traverses children nodes successfully when notifying about mutations", () => {
      const todosMap = new Map<string, { text: string }>()
      todosMap.set("123", { text: "Walk the dogs" })
      todosMap.set("abc", { text: "Clean the house" })

      const store = new Arbor(todosMap)
      const todo = store.state.get("abc")!

      todo.text = "House cleaned"

      expect(store.state.get("abc")!.text).toBe("House cleaned")
    })
  })

  describe("Example: Utility functions", () => {
    describe("detach", () => {
      it("cannot detach the state tree's root node", () => {
        const store = new Arbor({
          todos: [
            { id: 1, text: "Do the dishes" },
            { id: 2, text: "Walk the dogs" },
          ],
        })

        expect(() => detach(store.state)).toThrow(ArborError)
      })

      it("cannot detach values that are not already attached to the state tree", () => {
        expect(() => detach(123)).toThrow(NotAnArborNodeError)
        expect(() => detach("")).toThrow(NotAnArborNodeError)
        expect(() => detach({})).toThrow(NotAnArborNodeError)
      })

      it("cannot detach node already detached", () => {
        const store = new Arbor({
          todos: [
            { id: 1, text: "Do the dishes" },
            { id: 2, text: "Walk the dogs" },
          ],
        })

        const node = store.state.todos[0]
        detach(node)

        expect(() => detach(node)).toThrow(DetachedNodeError)
      })

      it("detaches a given ArborNode from the state tree", () => {
        const initialState = {
          todos: [
            { id: 1, text: "Do the dishes" },
            { id: 2, text: "Walk the dogs" },
          ],
        }

        const todo0 = initialState.todos[0]

        const store = new Arbor(initialState)

        const detched = detach(store.state.todos[0])

        expect(detched).toBe(todo0)
        expect(store.state).toEqual({
          todos: [{ id: 2, text: "Walk the dogs" }],
        })
      })

      it("detaches children from a Map node", () => {
        const todos = new Map<string, ArborNode<{ text: string }>>()
        todos.set("a", { text: "Do the dishes" })
        todos.set("b", { text: "Clean the house" })

        const store = new Arbor(todos)

        const todo = store.state.get("b")!
        const detachedTodo = detach(todo)

        expect(todos.get("b")).toBeUndefined()
        expect(store.state.get("b")).toBeUndefined()
        expect(detachedTodo).toBe(unwrap(todo))
      })
    })

    describe("merge", () => {
      it("cannot merge values that are not already attached to the state tree", () => {
        const node = { name: "Alice", age: 32 }

        expect(() => {
          merge(node, { name: "Alice Doe", age: 33 })
        }).toThrow(NotAnArborNodeError)
      })

      it("cannot merge data into node when node is detached from the state tree", () => {
        const store = new Arbor({
          todos: [
            { id: 1, text: "Do the dishes" },
            { id: 2, text: "Walk the dogs" },
          ],
        })

        const node = store.state.todos[0]
        detach(node)

        expect(() => {
          merge(node, { text: "" })
        }).toThrow(DetachedNodeError)
      })

      it("merges data into a given state tree node", () => {
        const store = new Arbor({
          todos: [
            { id: 1, text: "Do the dishes", active: false },
            { id: 2, text: "Walk the dogs", active: true },
          ],
        })

        const updated = merge(store.state.todos[0], {
          text: "Did the dishes",
          active: false,
        })

        expect(updated).toBe(store.state.todos[0])
        expect(store.state).toEqual({
          todos: [
            { id: 1, text: "Did the dishes", active: false },
            { id: 2, text: "Walk the dogs", active: true },
          ],
        })
      })
    })

    describe("path", () => {
      it("cannot determine a path for a value that is not attached to the state tree", () => {
        const node = { name: "Alice", age: 32 }

        expect(() => {
          path(node)
        }).toThrow(NotAnArborNodeError)
      })

      it("cannot determine a path for a detached node", () => {
        const store = new Arbor({
          todos: [
            { id: 1, text: "Do the dishes" },
            { id: 2, text: "Walk the dogs" },
          ],
        })

        const node = store.state.todos[0]
        detach(node)

        expect(() => {
          path(node)
        }).toThrow(DetachedNodeError)
      })

      it("determines the path of the node within the state tree", () => {
        const store = new Arbor({
          todos: [
            { id: 1, text: "Do the dishes" },
            { id: 2, text: "Walk the dogs" },
          ],
        })

        const rootPath = Path.root
        const todosPath = rootPath.child(Seed.from(store.state.todos))
        const todo0Path = todosPath.child(Seed.from(store.state.todos[0]))
        const todo1Path = todosPath.child(Seed.from(store.state.todos[1]))

        expect(rootPath.matches(store.state)).toBe(true)
        expect(todosPath.matches(store.state.todos)).toBe(true)
        expect(todo0Path.matches(store.state.todos[0])).toBe(true)
        expect(todo1Path.matches(store.state.todos[1])).toBe(true)
      })
    })

    describe("isDetached", () => {
      it("returns true if value is not an Arbor node", () => {
        const node = { name: "Alice", age: 32 }

        expect(isDetached(node)).toBe(true)
      })

      it("determines if a node is no longer within the state tree", () => {
        const store = new Arbor({
          todos: [
            { id: 1, text: "Do the dishes" },
            { id: 2, text: "Walk the dogs" },
          ],
        })

        const node = store.state.todos[0]

        expect(isDetached(node)).toBe(false)

        detach(node)

        expect(isDetached(node)).toBe(true)
      })
    })

    describe("unwrap", () => {
      it("throws an error if given value is not a state tree node", () => {
        const node = { name: "Alice", age: 32 }

        expect(() => {
          unwrap(node)
        }).toThrow(NotAnArborNodeError)
      })

      it("returns the value wrapped by the node", () => {
        const initialState = {
          todos: [
            { id: 1, text: "Do the dishes" },
            { id: 2, text: "Walk the dogs" },
          ],
        }

        const todo0 = initialState.todos[0]
        const store = new Arbor(initialState)

        expect(unwrap(store.state.todos[0])).toBe(todo0)
      })
    })
  })

  describe("path tracking", () => {
    it("leverages structural sharing to preserve identities of nodes in the state tree", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const trackedStore = track(store)
      const root = trackedStore.state
      const todos = trackedStore.state.todos
      const todo0 = trackedStore.state.todos[0]
      const todo1 = trackedStore.state.todos[1]

      todo0.active = true

      expect(root).not.toBe(trackedStore.state)
      expect(todos).not.toBe(trackedStore.state.todos)
      expect(todo0).not.toBe(trackedStore.state.todos[0])
      expect(todo1).toBe(trackedStore.state.todos[1])
    })

    it("reacts to mutations targeting paths being tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const subscriber = jest.fn()
      const trackedStore = track(store)

      trackedStore.subscribe(subscriber)

      // Tracks the following store paths
      //  1. trackedStore.state.todos
      //  2. trackedStore.state.todos[0]
      //  2. trackedStore.state.todos[0].active
      trackedStore.state.todos[0].active

      // Does not notifies trackedStore subscribers
      store.state.todos[0].id = 3
      store.state.todos[0].text = "Do the dishes again"
      // Does not notifies trackedStore subscribers
      store.state.todos[1].id = 4
      store.state.todos[1].text = "Walk the dogs again"
      store.state.todos[1].active = false
      store.state.todos[1] = { id: 3, text: "Clean the house", active: false }

      expect(subscriber).not.toHaveBeenCalled()

      store.state.todos[0].active = true
      store.state.todos[0] = { id: 3, text: "Clean the house", active: false }
      store.state.todos = []

      expect(subscriber).toHaveBeenCalledTimes(3)
    })

    it("reacts to mutations targeting the root of the state tree", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const subscriber = jest.fn()
      const trackedStore = track(store)

      // tracks the root of the store
      trackedStore.state

      trackedStore.subscribe(subscriber)

      store.setState({ todos: [] })

      expect(subscriber).toHaveBeenCalledTimes(1)
    })

    it("marks nodes as tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const trackedStore1 = track(store)

      expect(isTracked(trackedStore1.state)).toEqual(true)
      expect(isTracked(trackedStore1.state.todos)).toEqual(true)
      expect(isTracked(trackedStore1.state.todos[0])).toEqual(true)
      expect(isTracked(trackedStore1.state.todos[1])).toEqual(true)
    })

    it("automatically unwraps tracked node when creating a derived tracking scope", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const trackedStore1 = track(store)

      expect(trackedStore1.state).toEqual(store.state)
      expect(trackedStore1.state).not.toBe(store.state)
      expect(unwrapTrackedNode(trackedStore1.state)).toBe(store.state)

      const trackedStore2 = track(trackedStore1.state.todos[0])

      expect(trackedStore2.state).toEqual(store.state.todos[0])
      expect(trackedStore2.state).not.toBe(store.state.todos[0])
      expect(trackedStore2.state).not.toBe(trackedStore1.state.todos[0])
      expect(unwrapTrackedNode(trackedStore2.state)).toBe(store.state.todos[0])
    })
  })
})
