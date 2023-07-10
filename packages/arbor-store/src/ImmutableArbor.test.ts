/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-classes-per-file */
import { ImmutableArbor } from "./Arbor"
import { unwrap } from "./utilities"

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

    it("operates on the same snapshot when triggering subsequent mutations on the same node reference", () => {
      const store = new ImmutableArbor({
        count: 0,
      })

      const counter = store.state
      counter.count++
      counter.count++

      expect(store.state.count).toBe(1)
    })
  })
})
