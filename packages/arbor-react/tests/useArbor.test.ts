// @vitest-environment jsdom

import { Arbor, isArborNodeTracked, proxiable, unwrap } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useArbor } from "../src/useArbor"

describe("useArbor", () => {
  it("tracks accesses to node props", () => {
    const store = new Arbor([
      { name: "Carol" },
      { name: "Alice" },
      { name: "Bob" },
    ])

    const { result } = renderHook(() => useArbor(store))

    expect(isArborNodeTracked(result.current)).toBe(true)
    expect(isArborNodeTracked(result.current[0])).toBe(true)
    expect(isArborNodeTracked(result.current[1])).toBe(true)
    expect(isArborNodeTracked(result.current[2])).toBe(true)
  })

  it("returns the current state of the store", () => {
    const store = new Arbor({
      count: 0,
    })

    const { result } = renderHook(() => useArbor(store))

    expect(unwrap(result.current)).toBe(store.state)
  })

  it("updates the state whenever a store mutation is triggered", () => {
    const store = new Arbor({
      count: 0,
    })

    let counter = store.state

    const { result } = renderHook(() => useArbor(store))

    expect(unwrap(result.current)).toBe(counter)

    act(() => {
      store.state.count++
    })

    expect(result.current).not.toBe(counter)
    expect(result.current.count).toEqual(1)

    counter = store.state

    act(() => {
      store.state.count = 5
    })

    expect(result.current).not.toBe(counter)
    expect(result.current.count).toEqual(5)
  })

  it("unsubscribes from store when component is unmounted", () => {
    const store = new Arbor({
      count: 0,
    })

    const { result, unmount } = renderHook(() => useArbor(store))

    const initialSstate = result.current

    act(() => {
      result.current.count++
    })

    const nextState = result.current
    expect(initialSstate).not.toBe(nextState)

    unmount()

    act(() => {
      result.current.count++
    })

    expect(nextState).toBe(result.current)
  })

  it("automatically creates an arbor store when initialized with plain objects", () => {
    const { result } = renderHook(() =>
      useArbor({
        count: 0,
      })
    )

    expect(result.current.count).toBe(0)

    act(() => {
      result.current.count++
    })

    expect(result.current.count).toBe(1)

    act(() => {
      result.current.count = 5
    })

    expect(result.current.count).toBe(5)
  })

  it("supports custom object types to represent the state", () => {
    @proxiable
    class InputHandler {
      value = ""
      settings = {}
      onChange(e: { target: { value: string } }) {
        this.value = e.target.value
      }
    }

    const { result } = renderHook(() => useArbor(new InputHandler()))
    const originalState = result.current

    expect(result.current.value).toBe("")

    act(() => {
      result.current.value = "New value"
    })

    expect(result.current.value).toBe("New value")
    expect(result.current.settings).toBe(originalState.settings)

    act(() => {
      result.current.onChange({ target: { value: "Another value" } })
    })

    expect(result.current.value).toBe("Another value")
    expect(result.current.settings).toBe(originalState.settings)
  })

  it("allows subscribing to specific subtrees of an existing state tree", () => {
    const store = new Arbor({
      users: [{ name: "Alice" }, { name: "Bob" }],
    })

    const { result } = renderHook(() => useArbor(store.state.users[0]))

    expect(unwrap(result.current)).toBe(store.state.users[0])

    act(() => {
      result.current.name = "Alice Updated"
    })

    act(() => {
      store.state.users.push({ name: "Carol" })
    })

    expect(store.state.users[0]).toEqual({ name: "Alice Updated" })
  })

  it("throws an error when attemoting to initialize the hook with invalid values", () => {
    expect(() => useArbor(new Date())).toThrow(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )

    expect(() => useArbor("No strings allowed" as never)).toThrow(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )

    expect(() => useArbor(new (class {})())).toThrow(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )
  })
})
