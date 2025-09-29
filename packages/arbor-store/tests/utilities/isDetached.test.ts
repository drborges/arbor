import { describe, expect, it } from "vitest"
import { Arbor } from "../../src/arbor"
import { isDetached, detach } from "../../src/utilities"

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

  it("returns true if the node belongs to a detached path", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes", author: { name: "Alice" } },
        { id: 2, text: "Walk the dogs", author: { name: "Bob" } },
      ],
    })

    const alice = store.state.todos[0].author
    delete store.state.todos[0]

    expect(isDetached(alice)).toBe(true)
  })

  it("returns false for array items that moved positions but still exist in the observable state tree", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes" },
        { id: 2, text: "Walk the dogs" },
      ],
    })

    const todo1 = store.state.todos[0]
    const todo2 = store.state.todos[1]
    delete store.state.todos[0]

    expect(isDetached(todo1)).toBe(true)
    expect(isDetached(todo2)).toBe(false)
  })
})
