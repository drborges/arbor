import { describe, expect, it, vi } from "vitest"
import { Arbor } from "../../src/arbor"
import { NotAnArborNodeError, DetachedNodeError } from "../../src/errors"
import { merge, detach } from "../../src/utilities"

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
