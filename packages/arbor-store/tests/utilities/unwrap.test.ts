import { describe, expect, it } from "vitest"
import { Arbor } from "../../src/arbor"
import { NotAnArborNodeError } from "../../src/errors"
import { unwrap } from "../../src/utilities"

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
