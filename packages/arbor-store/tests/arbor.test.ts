import { describe, expect, it, vi } from "vitest"
import { Arbor } from "../src/arbor"
import { ArborProxiable, detached, proxiable } from "../src/decorators"
import { DetachedNodeError } from "../src/errors"
import { Seed } from "../src/path"
import { Path } from "../src/path/path"
import { detach, pathFor, unwrap } from "../src/utilities"

import { isNode } from "../src/guards"

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
      expect(store.getLinkFor(state)).toBeNull()
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
      const todo0Node = store.state.todos[0]
      const todo1Node = store.state.todos[1]

      store.state.todos[0] = todo1Node
      store.state.todos[1] = todo0Node

      expect(unwrap(store.state.todos)).toEqual([
        { text: "Walk the dogs" },
        { text: "Clean the house" },
      ])

      expect(unwrap(store.state.todos[0])).toBe(todo1)
      expect(unwrap(store.state.todos[1])).toBe(todo0)
      expect(todo1Node.text).toEqual("Walk the dogs")
      expect(store.state.todos[0].text).toEqual("Walk the dogs")
      expect(store.state.todos[1].text).toEqual("Clean the house")

      todo1Node.text = "Walk the dogs updated"

      expect(todo1Node.text).toEqual("Walk the dogs updated")
      expect(store.state.todos[0].text).toEqual("Walk the dogs updated")
      expect(store.state.todos[1].text).toEqual("Clean the house")
      expect(unwrap(store.state.todos)).toEqual([
        { text: "Walk the dogs updated" },
        { text: "Clean the house" },
      ])

      todo0Node.text = "Clean the house updated"

      expect(todo0Node.text).toEqual("Clean the house updated")
      expect(todo1Node.text).toEqual("Walk the dogs updated")
      expect(store.state.todos[0].text).toEqual("Walk the dogs updated")
      expect(store.state.todos[1].text).toEqual("Clean the house updated")
      expect(unwrap(store.state.todos)).toEqual([
        { text: "Walk the dogs updated" },
        { text: "Clean the house updated" },
      ])
    })

    it("automatically detaches a node when its value is replaced with another node", () => {
      const store = new Arbor({
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      })

      const todo0Node = store.state.todos[0]
      const todo1Node = store.state.todos[1]

      store.state.todos[0] = todo1Node

      expect(
        () => (todo0Node.text = "this update should throw an error")
      ).toThrow(DetachedNodeError)
    })

    it("allows for sibling paths to point to the same node", () => {
      const store = new Arbor({
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      })

      const todo1Node = store.state.todos[1]

      store.state.todos[0] = todo1Node

      expect(store.state.todos[0]).toBe(store.state.todos[1])
      expect(store.state).toEqual({
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
          expect(event.mutationPath.seeds.length).toBe(2)
          expect(event.mutationPath.seeds[0]).toBe(Seed.from(store.state))
          expect(event.mutationPath.seeds[1]).toBe(Seed.from(store.state[0]))
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
      expect(mutationPath1).toBe(pathFor(store.state[0]))
      expect(mutationPath2).toBe(pathFor(store.state[1]))
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
      expect(mutationPath1).toBe(pathFor(store.state[0]))
      expect(mutationPath2).toBe(pathFor(store.state[1]))
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
      expect(pathFor(activeTodos[0])).toBe(pathFor(store.state.todos[1]))
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
      expect(pathFor(activeTodos[0])).toBe(pathFor(store.state.todos[1]))
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
      expect(pathFor(activeTodos[0])).toBe(pathFor(store.state.all[1]))
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

      expect(mutationPath).toBe(pathFor(store.state.todos))
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

      expect(mutationPath).toBe(pathFor(store.state.todos))
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

      expect(mutationPath).toBe(pathFor(store.state.todos))
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

    it("prevents object methods from conflicting with the Proxy API", () => {
      @proxiable
      class NumberList {
        items: number[] = []

        get(index: number) {
          return this.items[index]
        }

        set(index: number, value: number) {
          this.items[index] = value
        }

        deleteProperty(index: number) {
          this.items.splice(index, 1)
        }
      }

      const todos = new Arbor(new NumberList())

      todos.state.set(0, 1)
      todos.state.set(1, 2)
      expect(todos.state.get(0)).toBe(1)
      expect(todos.state.get(1)).toBe(2)
      todos.state.deleteProperty(0)
      expect(todos.state.get(0)).toBe(2)
      expect(todos.state.get(1)).toBeUndefined()
    })
  })

  describe("state tree diff", () => {
    describe("root note mutations", () => {
      it("seeds the root node upon its creation", () => {
        const state = { count: 0 }

        new Arbor(state)

        expect(state).toBeSeeded()
      })

      it("creates a new node reference for the new root node state", () => {
        const store = new Arbor({ count: 0 })

        const root = store.state
        store.state.count++
        const newRoot = store.state

        expect(root).not.toBe(newRoot)
      })

      it("preserves the reference of the value being wrapped by the node", () => {
        const state = { count: 0 }
        const store = new Arbor(state)

        store.state.count++

        expect(store.state).toBeNodeOf(state)
      })

      it("replaces the root node with a new one", () => {
        const state = { count: 0 }
        const store = new Arbor(state)
        const root = store.state

        store.setState({ count: 1 })

        expect(store.state).toBeSeeded()
        expect(store.state).not.toBe(root)
        expect(store.state).not.toBeNodeOf(state)
      })
    })
  })
})
