import { describe, expect, it, vi } from "vitest"
import { Arbor } from "../../src/arbor"
import { ScopedStore } from "../../src/scoping/store"

describe("Array", () => {
  describe("Symbol.iterator", () => {
    it("exposes child nodes via iterator", () => {
      const store = new Arbor([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Carol" },
      ])

      const scoped = new ScopedStore(store)

      const alice = scoped.state[0]
      const bob = scoped.state[1]
      const carol = scoped.state[2]

      const iterator = scoped.state[Symbol.iterator]()

      const user1 = iterator.next().value
      const user2 = iterator.next().value
      const user3 = iterator.next().value

      expect(user1).toBe(alice)
      expect(user2).toBe(bob)
      expect(user3).toBe(carol)
    })
  })

  describe("Array#splice", () => {
    it("splices multiple items in a row", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const scoped = new ScopedStore(store)

      scoped.state.todos.splice(1, 1)

      expect(scoped.state).toEqual({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 3, text: "Clean the house" },
        ],
      })

      scoped.state.todos.splice(1, 1)

      expect(scoped.state).toEqual({
        todos: [{ id: 1, text: "Do the dishes" }],
      })
    })

    it("notifies subscribers even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      // accessing scoped.state.todos causes the scope to track that path
      scoped.state.todos.splice(1, 1)
      scoped.state.todos.splice(1, 1)

      expect(subscriber).toHaveBeenCalledTimes(2)
    })
  })

  describe("#reverse", () => {
    it("reverses the array", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const scoped = new ScopedStore(store)

      scoped.state.todos.reverse()

      expect(scoped.state).toEqual({
        todos: [
          { id: 3, text: "Clean the house" },
          { id: 2, text: "Walk the dogs" },
          { id: 1, text: "Do the dishes" },
        ],
      })
    })

    it("notifies subscribers even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      scoped.state.todos.reverse()

      expect(subscriber).toHaveBeenCalledTimes(1)
    })
  })

  describe("#push", () => {
    it("pushes a new item into the array", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const scoped = new ScopedStore(store)

      scoped.state.todos.push({ id: 4, text: "New todo" })

      expect(scoped.state).toEqual({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
          { id: 4, text: "New todo" },
        ],
      })
    })

    it("notifies subscribers even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      scoped.state.todos.push({ id: 4, text: "New todo" })

      expect(subscriber).toHaveBeenCalledTimes(1)
    })
  })

  describe("#pop", () => {
    it("removes the last item in the array", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const scoped = new ScopedStore(store)

      scoped.state.todos.pop()

      expect(scoped.state).toEqual({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
        ],
      })
    })

    it("notifies subscribers even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      scoped.state.todos.pop()

      expect(subscriber).toHaveBeenCalledTimes(1)
    })
  })

  describe("#shift", () => {
    it("shifts the array by one item", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const scoped = new ScopedStore(store)

      scoped.state.todos.shift()

      expect(scoped.state).toEqual({
        todos: [
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })
    })

    it("notifies subscribers even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      scoped.state.todos.shift()

      expect(subscriber).toHaveBeenCalledTimes(1)
    })
  })

  describe("#unshift", () => {
    it("unshifts the array by one item including two new items in its place", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const scoped = new ScopedStore(store)

      scoped.state.todos.unshift(
        { id: 4, text: "New todo 4" },
        { id: 5, text: "New todo 5" }
      )

      expect(scoped.state).toEqual({
        todos: [
          { id: 4, text: "New todo 4" },
          { id: 5, text: "New todo 5" },
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })
    })

    it("notifies subscribers even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      scoped.state.todos.unshift()

      expect(subscriber).toHaveBeenCalledTimes(1)
    })
  })

  describe("#sort", () => {
    it("sorts the array by the text field", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 3, text: "Clean the house" },
          { id: 2, text: "Walk the dogs" },
        ],
      })

      const scoped = new ScopedStore(store)

      scoped.state.todos.sort((a, b) => {
        if (a.text > b.text) return 1
        if (a.text < b.text) return -1
        return 0
      })

      expect(scoped.state).toEqual({
        todos: [
          { id: 3, text: "Clean the house" },
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
        ],
      })
    })

    it("notifies subscribers even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      scoped.state.todos.sort()

      expect(subscriber).toHaveBeenCalledTimes(1)
    })
  })

  describe("delete trap", () => {
    it("deletes an item from the array using the delete keyword", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 3, text: "Clean the house" },
          { id: 2, text: "Walk the dogs" },
        ],
      })

      const scoped = new ScopedStore(store)

      delete scoped.state.todos[1]

      expect(scoped.state).toEqual({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
        ],
      })
    })

    it("notifies subscribers even if items are not tracked", () => {
      const store = new Arbor({
        todos: [
          { id: 1, text: "Do the dishes" },
          { id: 2, text: "Walk the dogs" },
          { id: 3, text: "Clean the house" },
        ],
      })

      const subscriber = vi.fn()
      const scoped = new ScopedStore(store)

      scoped.subscribe(subscriber)

      delete scoped.state.todos[1]
      delete scoped.state.todos[1]

      expect(scoped).not.toBeTracking(scoped.state.todos, 1)

      expect(subscriber).toHaveBeenCalledTimes(2)
    })
  })
})
