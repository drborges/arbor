import Arbor from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArborValue from "./useArborValue"

describe("useArborValue", () => {
  it("initializes the state with the store's unwrapped root node", () => {
    const initialState = {
      users: [{ name: "Alice" }, { name: "Bob" }],
    }

    const store = new Arbor(initialState)

    const { result } = renderHook(() => useArborValue(store))

    expect(result.current).toBe(initialState)
  })

  it("updates the state when the store mutates", () => {
    const initialState = {
      users: [{ name: "Alice" }, { name: "Bob" }],
    }

    const store = new Arbor(initialState)

    const { result } = renderHook(() => useArborValue(store))

    act(() => {
      store.root.users[0].name = "Alice 2"
    })

    expect(result.current).not.toBe(initialState)
    expect(result.current.users).not.toBe(initialState.users)
    expect(result.current.users[0]).not.toBe(initialState.users[0])
    expect(result.current.users[1]).toBe(initialState.users[1])
    expect(result.current).toEqual({
      users: [{ name: "Alice 2" }, { name: "Bob" }],
    })
  })

  it("accepts a selector function", () => {
    const initialState = {
      users: [{ name: "Alice" }, { name: "Bob" }],
    }

    const store = new Arbor(initialState)

    const { result } = renderHook(() =>
      useArborValue(store, (state) => state.users[0])
    )

    expect(result.current).toBe(initialState.users[0])

    act(() => {
      store.root.users[1].name = "Bob 2"
    })

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.users[0].name = "Alice 2"
    })

    expect(result.all.length).toBe(2)
  })
})
