/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-classes-per-file */
import { describe, expect, it, vi } from "vitest"
import { Arbor, ImmutableArbor } from "../src/Arbor"
import { ArborProxiable, detached, proxiable } from "../src/decorators"
import {
  ArborError,
  DetachedNodeError,
  NotAnArborNodeError,
} from "../src/errors"
import { Path } from "../src/Path"
import { Seed } from "../src/Seed"
import { ArborNode } from "../src/types"
import { detach, isDetached, merge, pathFor, unwrap } from "../src/utilities"

import { isNode } from "../src/guards"
import { isArborNodeTracked, ScopedStore } from "../src/ScopedStore"

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

      expect(store.state).not.toBeNodeOf(state)
      expect(store.state.todos).not.toBeNodeOf(todos)
      expect(store.state.todos[0]).not.toBeNodeOf(todo0)
      expect(store.state.todos[1]).toBeNodeOf(todo1)
      expect(store.state.users).toBeNodeOf(users)
      expect(store.state.users[0]).toBeNodeOf(user0)
      expect(store.state.users[1]).toBeNodeOf(user1)
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
  describe("state tree", () => {
    it("updates a node within the state tree", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ])

      store.state[1].active = false

      expect(store.state[1]).toEqual({ name: "Alice", active: false })
      expect(store.state).toEqual([
        { name: "Carol", active: true },
        { name: "Alice", active: false },
        { name: "Bob", active: true },
      ])
    })

    it("applies structural sharing to compute the next state tree after a mutation", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ])

      const users = store.state
      const carol = store.state[0]
      const alice = store.state[1]
      const bob = store.state[2]

      expect(store.state).toBe(users)
      expect(store.state[0]).toBe(carol)
      expect(store.state[1]).toBe(alice)
      expect(store.state[2]).toBe(bob)

      alice.active = false

      expect(store.state).not.toBe(users)
      expect(store.state[0]).toBe(carol)
      expect(store.state[1]).not.toBe(alice)
      expect(store.state[2]).toBe(bob)
    })

    it("wraps values within proxy objects representing nodes in the state tree", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ])

      expect(store.state).toBeArborNode()
      expect(store.state[0]).toBeArborNode()
      expect(store.state[1]).toBeArborNode()
      expect(store.state[2]).toBeArborNode()

      store.state[1].active = false

      expect(store.state).toBeArborNode()
      expect(store.state[0]).toBeArborNode()
      expect(store.state[1]).toBeArborNode()
      expect(store.state[2]).toBeArborNode()
    })

    it("directly mutates values wrapped by Arbor nodes", () => {
      const state = [
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ]

      const store = new Arbor(state)

      const users = unwrap(store.state)
      const carol = unwrap(store.state[0])
      const alice = unwrap(store.state[1])
      const bob = unwrap(store.state[2])

      expect(state).toBe(users)
      expect(state[0]).toBe(carol)
      expect(state[1]).toBe(alice)
      expect(state[2]).toBe(bob)

      store.state[1].active = false

      expect(unwrap(store.state)).toBe(users)
      expect(unwrap(store.state[0])).toBe(carol)
      expect(unwrap(store.state[1])).toBe(alice)
      expect(unwrap(store.state[2])).toBe(bob)
    })

    it("adds root node to the state tree as soon as the store is created", () => {
      const state = [
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ]

      const store = new Arbor(state)

      expect(store.getNodeFor(state)).toBe(store.state)
      // Root nodes do not have a parent node, thus, no link from parent to child
      expect(store.getLinkFor(state)).toBeUndefined()
    })

    it("lazily add nodes to the state tree as they are accessed", () => {
      const state = [
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ]

      const store = new Arbor(state)

      expect(store).not.toHaveNodeFor(state[0])
      expect(store).not.toHaveNodeFor(state[1])
      expect(store).not.toHaveNodeFor(state[2])

      expect(store).not.toHaveLinkFor(state[0])
      expect(store).not.toHaveLinkFor(state[1])
      expect(store).not.toHaveLinkFor(state[2])

      store.state[0]
      store.state[1]
      store.state[2]

      expect(store.getNodeFor(state[0])).toBe(store.state[0])
      expect(store.getNodeFor(state[1])).toBe(store.state[1])
      expect(store.getNodeFor(state[2])).toBe(store.state[2])

      expect(store.getLinkFor(state[0])).toBe("0")
      expect(store.getLinkFor(state[1])).toBe("1")
      expect(store.getLinkFor(state[2])).toBe("2")
    })

    it("identifies nodes across mutations by their seed assigned to them when added to the state tree", () => {
      const state = [
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ]

      const store = new Arbor(state)

      expect(Seed.from(state)).toBeDefined()
      expect(Seed.from(state[0])).toBeUndefined()
      expect(Seed.from(state[1])).toBeUndefined()
      expect(Seed.from(state[2])).toBeUndefined()

      store.state[0]
      store.state[1]
      store.state[2]

      const rootSeed = Seed.from(state)
      const carolSeed = Seed.from(state[0])
      const aliceSeed = Seed.from(state[1])
      const bobSeed = Seed.from(state[2])

      expect(rootSeed).toBeDefined()
      expect(carolSeed).toBeDefined()
      expect(aliceSeed).toBeDefined()
      expect(bobSeed).toBeDefined()

      store.state[0].active = false

      expect(Seed.from(store.state)).toBe(rootSeed)
      expect(Seed.from(store.state[0])).toBe(carolSeed)
      expect(Seed.from(store.state[1])).toBe(aliceSeed)
      expect(Seed.from(store.state[2])).toBe(bobSeed)
    })

    it("automatically unwrap nodes when using them as values to initialize a store", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ])

      const state = store.state

      store.setState(state)

      expect(store.state).toBeProxiedExactlyOnce()
    })

    it("automatically unwraps nodes when creating a store off of an existing state tree", () => {
      const store1 = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ])

      const store2 = new Arbor(store1.state)

      expect(isNode(unwrap(store2.state))).not.toBe(true)
    })

    it("automatically unwraps nodes when using them as values to initialize a specific node in the state tree", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ])

      store.state[3] = store.state[0]

      expect(isNode(unwrap(store.state[3]))).toBe(false)
    })

    it("automatically unwraps nodes when setting its value as another state tree node", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ])

      const newValue = store.state[1]
      store.setNode(store.state[0], newValue)

      expect(store.state[0]).toBe(store.state[1])
      expect(isNode(unwrap(store.state[0]))).toBe(false)
      expect(unwrap(store.state[0])).not.toBe(store.state[1])
    })

    it("detaches node when overriding it with another node", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
        { name: "Bob", active: true },
      ])

      store.state[3] = store.state[0]

      const carol = store.state[0]
      const alice = store.state[1]

      store.state[0] = alice

      expect(carol).toBeDetached()
      expect(store.getLinkFor(alice)).toBe("0")
      expect(store.getNodeFor(alice)).toBe(store.state[0])
      expect(store.getNodeFor(alice)).toBe(store.state[1])
    })

    it("binds node methods to the node itself", () => {
      const store = new Arbor({
        users: [
          { name: "Carol", active: true },
          { name: "Alice", active: false },
          { name: "Bob", active: true },
        ],

        active() {
          return this.users.filter((u) => u.active)
        },
      })

      const active = store.state.active

      const activeUsers = active()

      expect(activeUsers.length).toBe(2)
      expect(activeUsers[0]).toBe(store.state.users[0])
      expect(activeUsers[1]).toBe(store.state.users[2])
    })

    it("can trigger subsequent mutations to the same node reference", () => {
      const store = new Arbor({ count: 0 })
      const counter = store.state

      counter.count++
      expect(counter.count).toBe(1)
      expect(store.state.count).toBe(1)
      expect(counter).not.toBe(store.state)

      counter.count++
      expect(counter.count).toBe(2)
      expect(store.state.count).toBe(2)
      expect(counter).not.toBe(store.state)

      counter.count++
      expect(counter.count).toBe(3)
      expect(store.state.count).toBe(3)
      expect(counter).not.toBe(store.state)
    })

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
      const subscriber = vi.fn()
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

      const subscriber = vi.fn()
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

      const subscriber = vi.fn()
      store.subscribe(subscriber)

      store.setState({ count: 4 })

      expect(subscriber).toHaveBeenCalledTimes(1)
    })

    it("sets the value of a given node regardless of where it is in the state tree", () => {
      const store = new Arbor({
        todos: [{ id: 1 }, { id: 2 }],
      })

      const firstTodo = store.state.todos[0]
      const newNode = store.setNode(firstTodo, {
        id: 3,
      })

      expect(firstTodo).toBeDetached()
      expect(newNode).toBe(store.state.todos[0])
      expect(store.state).toEqual({
        todos: [{ id: 3 }, { id: 2 }],
      })

      const root = store.state
      const newRootNode = store.setNode(root, {
        todos: [],
      })

      expect(root).toBeDetached()
      expect(newRootNode).toBe(store.state)
      expect(store.state).toEqual({
        todos: [],
      })
    })
  })

  describe("path healing", () => {
    it("refreshes all node links when reversing an array", () => {
      const store = new Arbor([
        { name: "Alice" },
        { name: "Carol" },
        { name: "Bob" },
      ])

      const alice = store.state[0]
      const carol = store.state[1]
      const bob = store.state[2]

      store.state.reverse()

      expect(store.getLinkFor(alice)).toBe("2")
      expect(store.getLinkFor(carol)).toBe("1")
      expect(store.getLinkFor(bob)).toBe("0")

      expect(store.state[0]).toBe(bob)
      expect(store.state[1]).toBe(carol)
      expect(store.state[2]).toBe(alice)
    })

    it("refreshes all node links when deleting a node from an array", () => {
      const store = new Arbor([
        { name: "Alice" },
        { name: "Carol" },
        { name: "Bob" },
      ])

      const alice = store.state[0]
      const carol = store.state[1]
      const bob = store.state[2]

      delete store.state[0]

      expect(store.state[0]).toBe(carol)
      expect(store.state[1]).toBe(bob)
      expect(alice).toBeDetached()

      carol.name = "Carol updated"

      expect(store.state).toEqual([{ name: "Carol updated" }, { name: "Bob" }])
    })

    it("detach node from an array", () => {
      const state = [{ name: "Alice" }, { name: "Carol" }, { name: "Bob" }]
      const aliceValue = state[0]
      const store = new Arbor(state)

      const alice = store.state[0]
      const carol = store.state[1]
      const bob = store.state[2]

      const detachedAlice = detach(alice)
      expect(detachedAlice).toBe(aliceValue)
      expect(alice).toBeDetached()

      expect(store.state[0]).toBe(carol)
      expect(store.state[1]).toBe(bob)
      expect(store.state[2]).toBeUndefined()
      expect(store.state).toEqual([{ name: "Carol" }, { name: "Bob" }])
      expect(store.getLinkFor(carol)).toBe("0")
      expect(store.getLinkFor(bob)).toBe("1")

      bob.name = "Bob updated"

      expect(store.state).toEqual([{ name: "Carol" }, { name: "Bob updated" }])
    })

    it("remove node link when popping it from an array", () => {
      const store = new Arbor([
        { name: "Alice" },
        { name: "Carol" },
        { name: "Bob" },
      ])

      const alice = store.state[0]
      const carol = store.state[1]
      const bob = store.state[2]

      store.state.pop()

      expect(bob).toBeDetached()
      expect(store.getLinkFor(alice)).toBe("0")
      expect(store.getLinkFor(carol)).toBe("1")
      expect(store.getLinkFor(bob)).toBeUndefined()
      expect(store.getNodeFor(bob)).toBeUndefined()
    })

    it("refreshes node links when shifting array items", () => {
      const state = [{ name: "Alice" }, { name: "Carol" }, { name: "Bob" }]
      const aliceValue = state[0]
      const store = new Arbor(state)

      const alice = store.state[0]
      const carol = store.state[1]
      const bob = store.state[2]

      const shifted = store.state.shift()

      expect(shifted).toBe(aliceValue)
      expect(alice).toBeDetached()
      expect(store.state[0]).toBe(carol)
      expect(store.state[1]).toBe(bob)
      expect(store.state[2]).toBeUndefined()
      expect(store.getLinkFor(alice)).toBeUndefined()
      expect(store.getLinkFor(carol)).toBe("0")
      expect(store.getLinkFor(bob)).toBe("1")
    })

    it("refreshes node links when sorting an array", () => {
      const store = new Arbor([
        { name: "Carol" },
        { name: "Bob" },
        { name: "Alice" },
      ])

      const carol = store.state[0]
      const bob = store.state[1]
      const alice = store.state[2]

      const sorted = store.state.sort((a, b) => a.name.localeCompare(b.name))

      expect(sorted[0]).toBe(alice)
      expect(sorted[1]).toBe(bob)
      expect(sorted[2]).toBe(carol)

      expect(store.state[0]).toBe(alice)
      expect(store.state[1]).toBe(bob)
      expect(store.state[2]).toBe(carol)

      expect(store.getLinkFor(alice)).toBe("0")
      expect(store.getLinkFor(bob)).toBe("1")
      expect(store.getLinkFor(carol)).toBe("2")
    })

    it("refreshes node links when splicing an array", () => {
      const store = new Arbor([
        { name: "Carol" },
        { name: "Bob" },
        { name: "Alice" },
      ])

      const carol = store.state[0]
      const bob = store.state[1]
      const alice = store.state[2]
      const johnValue = { name: "John" }
      const biancaValue = { name: "Bianca" }

      store.state.splice(1, 2, johnValue, biancaValue)

      expect(bob).toBeDetached()
      expect(alice).toBeDetached()
      expect(store.state[0]).toBe(carol)
      expect(store.state[1]).toEqual(johnValue)
      expect(store.state[2]).toEqual(biancaValue)

      expect(store.getLinkFor(carol)).toBe("0")
      expect(store.getLinkFor(johnValue)).toBe("1")
      expect(store.getLinkFor(biancaValue)).toBe("2")
    })

    it("refreshes node links when unshifting an array", () => {
      const store = new Arbor([
        { name: "Carol" },
        { name: "Bob" },
        { name: "Alice" },
      ])

      const carol = store.state[0]
      const bob = store.state[1]
      const alice = store.state[2]
      const john = { name: "John" }
      const bianca = { name: "Bianca" }

      const length = store.state.unshift(john, bianca)

      expect(length).toBe(5)

      expect(store.state[0]).toEqual(john)
      expect(store.state[1]).toEqual(bianca)
      expect(store.state[2]).toBe(carol)
      expect(store.state[3]).toEqual(bob)
      expect(store.state[4]).toEqual(alice)

      expect(store.getLinkFor(john)).toBe("0")
      expect(store.getLinkFor(bianca)).toBe("1")
      expect(store.getLinkFor(carol)).toBe("2")
      expect(store.getLinkFor(bob)).toBe("3")
      expect(store.getLinkFor(alice)).toBe("4")
    })
  })

  describe("Example: Subscriptions", () => {
    it("subscribes to any store mutations (any mutations to any node in the state tree)", () => {
      const store = new Arbor([
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ])

      const subscriber1 = vi.fn()
      const subscriber2 = vi.fn()

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

      const subscriber1 = vi.fn()
      const subscriber2 = vi.fn()
      const subscriber3 = vi.fn()

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
      const subscriber1 = vi.fn()
      const subscriber2 = vi.fn()

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
      const subscriber = vi.fn()
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

      const subscriber = vi.fn()
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

      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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
      const subscriber1 = vi.fn()
      const subscriber2 = vi.fn()
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

      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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
      expect(pathFor(activeTodos[0]).matches(store.state.todos[1])).toBe(true)
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
      expect(pathFor(activeTodos[0]).matches(store.state.todos[1])).toBe(true)
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
      expect(pathFor(activeTodos[0]).matches(store.state.all[1])).toBe(true)
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
      const subscriber = vi.fn()
      const store = new Arbor([{ text: "Do the dishes", status: "todo" }])

      store.subscribe(subscriber)
      store.state.push({ text: "Walk the dogs", status: "todo" })

      const mutationPath = subscriber.mock.calls[0][0].mutationPath as Path

      expect(mutationPath.isRoot()).toBe(true)
      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual([])
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("push")
      expect(subscriber.mock.calls[0][0].state).toBe(store.state)

      expect(store.state).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })

    it("makes Array#splice reactive", () => {
      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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
      const subscriber = vi.fn()
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

      const subscriber = vi.fn()
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

      const subscriber = vi.fn()
      store.subscribe(subscriber)

      store.state.todos.set("123", todosMap.get("123")!)
      store.state.todos.set("123", store.state.todos.get("123")!)

      expect(subscriber).not.toHaveBeenCalled()
    })

    it("supports the same value to be added to the map under different keys", () => {
      const todosMap = new Map<string, { text: string }>()
      todosMap.set("123", { text: "Walk the dogs" })
      todosMap.set("abc", { text: "Clean the house" })

      const store = new Arbor({
        todos: todosMap,
      })

      const todo1 = store.state.todos.get("123")!
      const todo2 = store.state.todos.get("abc")!

      store.state.todos.set("123", todo2)

      expect(todo1).toBeDetached()
      expect(store.state.todos.get("123")).toBe(todo2)
      expect(store.state.todos.get("123")).toBe(store.state.todos.get("abc"))
    })

    it("can delete a node stored under multiple keys", () => {
      const todosMap = new Map<string, { text: string }>()
      todosMap.set("123", { text: "Walk the dogs" })
      todosMap.set("abc", { text: "Clean the house" })

      const store = new Arbor({
        todos: todosMap,
      })

      const todo1 = store.state.todos.get("123")!
      const todo2 = store.state.todos.get("abc")!

      store.state.todos.set("123", todo2)

      store.state.todos.delete("123")

      expect(todo1).toBeDetached()
      expect(todo2).toBeDetached()
      expect(store.state.todos.get("abc")).toEqual(todo2)
      expect(store.state.todos.get("123")).toBeUndefined()

      store.state.todos.delete("abc")

      expect(todo2).toBeDetached()
      expect(store.state.todos.get("123")).toBeUndefined()
      expect(store.state.todos.get("abc")).toBeUndefined()
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

      const subscriber = vi.fn()
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

      const subscriber = vi.fn()
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

    it("detaches all children nodes when clearing a map", () => {
      type Todo = {
        content: string
      }

      const todosMap = new Map<string, Todo>()
      todosMap.set("123", { content: "Walk the dogs" })
      todosMap.set("abc", { content: "Do the dishes" })

      const store = new Arbor({
        todos: todosMap,
      })

      const todo1 = store.state.todos.get("123")!
      const todo2 = store.state.todos.get("abc")!

      store.state.todos.clear()

      expect(todo1).toBeDetached()
      expect(todo2).toBeDetached()
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

      const node = store.getNodeAt(pathFor(todo))

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
          pathFor(node)
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
          pathFor(node)
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

      const scopedStore = new ScopedStore(store)
      const root = scopedStore.state
      const todos = scopedStore.state.todos
      const todo0 = scopedStore.state.todos[0]
      const todo1 = scopedStore.state.todos[1]

      todo0.active = true

      expect(root).not.toBe(scopedStore.state)
      expect(todos).not.toBe(scopedStore.state.todos)
      expect(todo0).not.toBe(scopedStore.state.todos[0])
      expect(todo1).toBe(scopedStore.state.todos[1])

      expect(root).toEqual(scopedStore.state)
      expect(todos).toEqual(scopedStore.state.todos)
      expect(todo0).toEqual(scopedStore.state.todos[0])
    })

    it("reacts to mutations targeting paths being tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const subscriber = vi.fn()
      const scopedStore = new ScopedStore(store)

      scopedStore.subscribe(subscriber)

      // Tracks the following store paths
      //  1. scopedStore.state.todos
      //  2. scopedStore.state.todos[0]
      //  2. scopedStore.state.todos[0].active
      scopedStore.state.todos[0].active

      // Does not notifies scopedStore subscribers
      store.state.todos[0].id = 3
      store.state.todos[0].text = "Do the dishes again"
      // Does not notifies scopedStore subscribers
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

      const subscriber = vi.fn()
      const scopedStore = new ScopedStore(store)

      scopedStore.subscribe(subscriber)

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

      const scopedStore1 = new ScopedStore(store)

      expect(isArborNodeTracked(scopedStore1.state)).toEqual(true)
      expect(isArborNodeTracked(scopedStore1.state.todos)).toEqual(true)
      expect(isArborNodeTracked(scopedStore1.state.todos[0])).toEqual(true)
      expect(isArborNodeTracked(scopedStore1.state.todos[1])).toEqual(true)
    })

    it("automatically unwraps tracked node when creating a derived tracking scope", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const scopedStore1 = new ScopedStore(store)

      expect(scopedStore1.state).toEqual(store.state)
      expect(scopedStore1.state).not.toBe(store.state)
      expect(unwrap(scopedStore1.state)).toBe(store.state)

      const scopedStore2 = new ScopedStore(scopedStore1.state.todos[0])

      expect(scopedStore2.state).toEqual(store.state.todos[0])
      expect(scopedStore2.state).not.toBe(store.state.todos[0])
      expect(scopedStore2.state).not.toBe(scopedStore1.state.todos[0])
      expect(unwrap(scopedStore2.state)).toBe(store.state.todos[0])
    })

    it("isolates subscriptions to their own tracking scope", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const subscriber1 = vi.fn()
      const subscriber2 = vi.fn()

      const scopedStore1 = new ScopedStore(store)
      scopedStore1.subscribe(subscriber1)

      // Causes scopedStore1 to watch mutations to the following paths:
      // 1. root
      // 2. root.todos
      // 3. root.todos[0]
      const firstTodo = scopedStore1.state.todos[0]

      const scopedStore2 = new ScopedStore(firstTodo)
      scopedStore2.subscribe(subscriber2)

      // Causes scopedStore2 to watch mutations to the following paths but does not affect scopedStore1:
      // 1. root.todos[0].active
      scopedStore2.state.active = true

      expect(subscriber1).not.toHaveBeenCalled()
      expect(subscriber2).toHaveBeenCalledTimes(1)

      scopedStore1.state.todos[2] = {
        id: 3,
        text: "Learn Arbor",
        active: true,
      }

      expect(subscriber1).toHaveBeenCalledTimes(1)
      expect(subscriber2).toHaveBeenCalledTimes(1)
    })

    it("allows pushing the same item multiple times to the array", () => {
      const store = new Arbor([{ name: "Alice" }, { name: "Carol" }])
      const bianca = { name: "bianca" }
      const length = store.state.push(bianca, bianca)

      expect(length).toBe(4)
      expect(store.getLinkFor(store.state[0])).toBe("0")
      expect(store.getLinkFor(store.state[1])).toBe("1")
      // since the array index 2 and 3 are the same object references, they will end up
      // having the same link within the sate tree.
      expect(store.getLinkFor(store.state[2])).toBe("2")
      expect(store.getLinkFor(store.state[3])).toBe("2")
      expect(store.state).toEqual([
        { name: "Alice" },
        { name: "Carol" },
        { name: "bianca" },
        { name: "bianca" },
      ])
    })

    it("is able to track nodes resulted from method calls", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes", active: false },
          { id: 2, text: "Walk the dogs", active: true },
        ],
      })

      const scopedStore = new ScopedStore(store)

      const activeTodo = scopedStore.state.todos.find((t) => t.active)

      expect(isArborNodeTracked(activeTodo)).toBe(true)
      expect(activeTodo).toBe(scopedStore.state.todos[1])
    })

    it("handles mutations to the root of the store", () => {
      const store = new Arbor([
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ])

      const subscriber = vi.fn()
      const scopedStore = new ScopedStore(store)
      scopedStore.subscribe(subscriber)

      scopedStore.state.push({ id: 3, text: "Walk the dogs", active: true })

      expect(subscriber).toHaveBeenCalledTimes(1)
    })

    it("allows tracking a specific node within the state tree", () => {
      const store = new Arbor([
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ])

      const scopedStore = new ScopedStore(store.state[0])

      expect(unwrap(scopedStore.state)).toBe(store.state[0])
    })

    it("creates a virtual state tree from a given subtree", () => {
      const store = new Arbor([
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ])

      const scopedStore = new ScopedStore(store.state[0])

      expect(unwrap(scopedStore.state)).toBe(store.state[0])

      const newState = scopedStore.setState({
        id: 3,
        text: "Learn Arbor",
        active: true,
      })

      expect(unwrap(newState)).toBe(store.state[0])
      expect(newState).toEqual({
        id: 3,
        text: "Learn Arbor",
        active: true,
      })
    })

    it("tracks new array items being added", () => {
      const store = new Arbor([{ name: "Alice" }, { name: "Bob" }])

      const subscriber = vi.fn()
      const scopedStore = new ScopedStore(store)
      scopedStore.subscribe(subscriber)

      store.state.push({ name: "Carol" })

      expect(subscriber).toHaveBeenCalledTimes(1)
    })

    it("tracks new props being added to nodes", () => {
      const store = new Arbor({ users: [{ name: "Alice" }, { name: "Bob" }] })

      const subscriber = vi.fn()
      const scopedStore = new ScopedStore(store)
      scopedStore.subscribe(subscriber)

      // track state.users
      scopedStore.state.users[1]

      store.state.users[2] = { name: "Carol" }

      expect(subscriber).toHaveBeenCalledTimes(1)
    })

    it("preserves children node path tracking when plucking them through a method operation (like filter, map, etc...)", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: false },
      ])
      const tracked = new ScopedStore(store.state)

      store.state.filter // binds filter to the original store
      const filterBoundToTrackedStore = tracked.state.filter
      const activeUsers = filterBoundToTrackedStore((u) => u.active)

      expect(isArborNodeTracked(activeUsers[0])).toBe(true)
    })

    it("preserves path tracking on nodes 'plucked' from the state tree", () => {
      const store = new Arbor([
        { name: "Carol", active: true },
        { name: "Alice", active: false },
      ])
      const tracked = new ScopedStore(store.state)
      const subscriber = vi.fn()

      tracked.subscribe(subscriber)

      const carol = tracked.state[0]

      carol.active = false

      expect(isArborNodeTracked(carol)).toBe(true)
      expect(subscriber).toHaveBeenCalledTimes(1)
    })

    it("can track path access on nodes 'pluck' from the state tree", () => {
      const store = new Arbor({
        users: [
          { name: "Carol", active: true },
          { name: "Alice", active: false },
        ],
      })
      const tracked = new ScopedStore(store)

      const carol = tracked.state.users[0]
      expect(isArborNodeTracked(carol)).toBe(true)
    })

    it("ensure node methods have stable memory reference across updates", () => {
      const store = new Arbor({
        todos: ["Do the dishes"],
        users: ["Carol", "Alice"],
      })

      const tracked = new ScopedStore(store)
      const userFilter = tracked.state.users.filter

      expect(userFilter).toBe(tracked.state.users.filter)

      tracked.state.todos[0] = "Clean the house"

      expect(userFilter).toBe(tracked.state.users.filter)

      tracked.state.users.push("Bob")

      expect(userFilter).toBe(tracked.state.users.filter)
    })

    it("can safely use a method reference across node updates", () => {
      const store = new Arbor({
        users: [
          { name: "Carol", active: true },
          { name: "Alice", active: false },
        ],
      })

      const tracked = new ScopedStore(store)
      const userFilter = tracked.state.users.filter

      expect(userFilter((u) => u.active)).toEqual([
        { name: "Carol", active: true },
      ])

      store.state.users[1].active = true

      expect(userFilter((u) => u.active)).toEqual([
        { name: "Carol", active: true },
        { name: "Alice", active: true },
      ])

      store.state.users[0].active = false

      expect(userFilter((u) => u.active)).toEqual([
        { name: "Alice", active: true },
      ])
    })

    it("can handle null props", () => {
      const store = new Arbor({ name: "Carol", email: null })
      const tracked = new ScopedStore(store.state)

      expect(tracked.state.email).toBeNull()
    })
  })

  it("does not track detached props", () => {
    @proxiable
    class SomeNode {
      @detached untrackedProp = "untracked"
      trackedProp = "tracked"
    }

    const store = new ScopedStore(new Arbor(new SomeNode()))

    store.state.untrackedProp
    store.state.trackedProp

    expect(store.scope.isTracking(store.state, "trackedProp")).toBe(true)
    expect(store.scope.isTracking(store.state, "untrackedProp")).toBe(false)
  })

  it("binds methods to the path tracking proxy", () => {
    @proxiable
    class Todo {
      constructor(public text = "") {}
    }

    @proxiable
    class TodoApp {
      todos: Todo[] = []

      removeTodo(todo) {
        this.todos = this.todos.filter((t) => t !== todo)
      }
    }

    const store = new ScopedStore(new Arbor(new TodoApp()))
    const subscriber = vi.fn()

    store.subscribe(subscriber)

    const state = store.state
    state.todos = [new Todo("Do the dishes"), new Todo("Clean the house")]
    state.removeTodo(state.todos[0])
    state.todos.push(new Todo("Walk the dogs"))

    expect(subscriber.mock.calls.length).toBe(3)
    expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("set")
    expect(subscriber.mock.calls[1][0].metadata.operation).toEqual("set")
    expect(subscriber.mock.calls[2][0].metadata.operation).toEqual("push")
  })

  it("binds methods to the instance of the node they belong to", () => {
    @proxiable
    class Todo {
      constructor(public text = "", public done = false) {}

      toggle() {
        this.done = !this.done
      }
    }

    @proxiable
    class TodoApp {
      todos: Todo[] = []
    }

    const store = new ScopedStore(new Arbor(new TodoApp()))
    const subscriber = vi.fn()

    store.subscribe(subscriber)

    const state = store.state
    state.todos = [new Todo("Do the dishes"), new Todo("Clean the house")]

    state.todos[0].toggle()
    state.todos[1].toggle()

    expect(state.todos[0].done).toBe(true)
    expect(state.todos[1].done).toBe(true)
  })
})
