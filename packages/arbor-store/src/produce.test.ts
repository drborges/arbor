import Arbor from "./Arbor"
import isNode from "./isNode"
import produce from "./produce"
import BaseNode from "./BaseNode"

class Todo extends BaseNode<Todo> {
  id: number
  text: string
  completed = false
}

const currentState = [
  new Todo({ id: 123, text: "Do the dishes" }),
  new Todo({ id: 124, text: "Walk the dogs" }),
]

describe("mutate", () => {
  it("produces the next state off the current state", () => {
    const nextState = produce((state) => {
      state[0].completed = true
      state[0].text = "Clean the house"
    })(currentState)

    expect(nextState).not.toBe(currentState)
    expect(nextState[0]).toBeInstanceOf(Todo)
    expect(nextState[0]).not.toBe(currentState[0])
    expect(nextState[1]).toBeInstanceOf(Todo)
    expect(nextState[1]).toBe(currentState[1])
    expect(nextState).toEqual([
      { id: 123, completed: true, text: "Clean the house" },
      { id: 124, completed: false, text: "Walk the dogs" },
    ])
  })

  it("performs a noop when given state is null", () => {
    const nextState = produce((state) => {
      state[0].completed = true
      state[0].text = "Clean the house"
    })(null)

    expect(nextState).toBe(null)
  })

  it("performs a noop when given state is undefined", () => {
    const nextState = produce((state) => {
      state[0].completed = true
      state[0].text = "Clean the house"
    })(undefined)

    expect(nextState).toBe(undefined)
  })

  it("throws an error when state is not an object", () => {
    expect(() => {
      produce((state) => {
        state[0].completed = true
        state[0].text = "Clean the house"
      })(5 as any)
    }).toThrowError()

    expect(() => {
      produce((state) => {
        state[0].completed = true
        state[0].text = "Clean the house"
      })("Some string" as any)
    }).toThrowError()

    expect(() => {
      produce((state) => {
        state[0].completed = true
        state[0].text = "Clean the house"
      })(new Date())
    }).toThrowError()
  })

  it("automatically unwraps Arbor nodes when used as current state", () => {
    const store = new Arbor(currentState)

    const nextState = produce((state) => {
      state[0].completed = true
      state[0].text = "Clean the house"
    })(store.root)

    expect(isNode(nextState)).toBe(false)
    expect(isNode(nextState[0])).toBe(false)
    expect(isNode(nextState[1])).toBe(false)
  })
})
