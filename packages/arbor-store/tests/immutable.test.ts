import { describe, expect, it } from "vitest"
import { DetachedNodeError } from "../src/errors"
import { ImmutableArbor } from "../src/immutable"
import { unwrap } from "../src/utilities"

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

      expect(state).toBeSeeded()
      expect(state.todos).toBeSeeded()
      expect(state.todos[0]).not.toBeSeeded()
      expect(state.todos[1]).not.toBeSeeded()

      delete store.state.todos[0]

      // mutations do not seed nodes.
      // Nodes are only seeded when accessed/read
      expect(state.todos[0]).not.toBeSeeded()

      // todos[0] should still exist in the previous snapshot
      expect(todos.length).toEqual(2)
      expect(todos[0]).toBeNodeOf(state.todos[0])

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

      const todo0 = store.state.todos[0]

      delete store.state.todos[0]

      expect(() => {
        todo0.text = "No longer in the state tree"
      }).toThrow(DetachedNodeError)
      expect(store.state).toEqual({
        todos: [{ text: "Walk the dogs" }],
      })
    })

    it("allows having sibling nodes with the same value", () => {
      const store = new ImmutableArbor({
        todos: [{ text: "Clean the house" }, { text: "Walk the dogs" }],
      })

      const todo0Node = store.state.todos[0]
      const todo1Node = store.state.todos[1]

      store.state.todos[0] = todo1Node

      expect(store.state.todos[0]).not.toBe(todo1Node)
      expect(store.state.todos[1]).not.toBe(todo1Node)
      expect(unwrap(store.state.todos[0])).toBe(unwrap(todo1Node))
      expect(unwrap(store.state.todos[1])).toBe(unwrap(todo1Node))
      expect(store.getNodeFor(todo0Node)).toBe(undefined)
      expect(store.state).toEqual({
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

      expect(todo1Node.text).toEqual("Walk the dogs")
      expect(store.state.todos[0].text).toEqual("Walk the dogs updated")
      expect(store.state.todos[1].text).toEqual("Clean the house")
      expect(unwrap(store.state.todos)).toEqual([
        { text: "Walk the dogs updated" },
        { text: "Clean the house" },
      ])

      todo0Node.text = "Clean the house updated"

      expect(todo0Node.text).toEqual("Clean the house")
      expect(todo1Node.text).toEqual("Walk the dogs")
      expect(store.state.todos[0].text).toEqual("Walk the dogs updated")
      expect(store.state.todos[1].text).toEqual("Clean the house updated")
      expect(unwrap(store.state.todos)).toEqual([
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
