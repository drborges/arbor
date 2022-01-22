import { act, renderHook } from "@testing-library/react-hooks/native"

import useArborState from "./useArborState"

describe("useArborState", () => {
  it("initializes the state with initial data", () => {
    const initialState = {
      users: [
        { name: "Alice", address: { street: "Walnut 123" } },
        { name: "Bob", address: { street: "Walnut 124" } },
      ],
    }

    const { result } = renderHook(() => useArborState(initialState))
    const [state] = result.current

    expect(state).toBe(initialState)
  })

  it("updates the state applying structural sharing", () => {
    const initialState = {
      users: [
        { name: "Alice", address: { street: "Walnut 123" }, notifications: {} },
        { name: "Bob", address: { street: "Walnut 124" }, notifications: {} },
      ],
    }

    const { result } = renderHook(() => useArborState(initialState))
    const [state, setState] = result.current

    act(() => {
      setState((currentState) => {
        currentState.users[0].address.street = "Walnut 1234"
      })
    })

    const [newState, newSetState] = result.current

    expect(newSetState).toBe(setState)
    expect(newState).not.toBe(state)
    expect(newState.users).not.toBe(state.users)
    expect(newState.users[0]).not.toBe(state.users[0])
    expect(newState.users[0].address).not.toBe(state.users[0].address)
    expect(newState.users[0].notifications).toBe(state.users[0].notifications)
    expect(newState.users[1]).toBe(state.users[1])
    expect(newState).toEqual({
      users: [
        {
          name: "Alice",
          address: { street: "Walnut 1234" },
          notifications: {},
        },
        { name: "Bob", address: { street: "Walnut 124" }, notifications: {} },
      ],
    })
  })
})
