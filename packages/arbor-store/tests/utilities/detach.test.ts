import { describe, expect, it } from "vitest"
import { Arbor } from "../../src/arbor"
import {
  ArborError,
  NotAnArborNodeError,
  DetachedNodeError,
} from "../../src/errors"
import { ArborNode } from "../../src/types"
import { detach, unwrap } from "../../src/utilities"

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
