import { Arbor } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks"

import { useArborSelector } from "./useArborSelector"

describe("useArborSelector", () => {
  it("selects a derived state to watch for", () => {
    const store = new Arbor([
      { text: "Clean the house" },
      { text: "Do the dishes" },
    ])

    const { result } = renderHook(() =>
      useArborSelector(store, (todos) => todos.length)
    )

    expect(result.current).toBe(2)

    act(() => {
      store.state.pop()
    })

    expect(result.current).toBe(1)

    act(() => {
      store.state.push({ text: "Walk the dogs" })
    })

    expect(result.current).toBe(2)

    store.state[0].text = "This will not trigger a re-render"

    expect(result.current).toBe(2)
  })

  it("selects a derived state to watch for from a specific state tree node", () => {
    const store = new Arbor([
      { text: "Clean the house", done: false },
      { text: "Do the dishes", done: true },
    ])

    const { result } = renderHook(() =>
      useArborSelector(store.state[0], (todo) => todo.done)
    )

    expect(result.current).toBe(false)

    act(() => {
      store.state.pop()
    })

    expect(result.current).toBe(false)

    act(() => {
      store.state[0].done = true
    })

    expect(result.current).toBe(true)

    act(() => {
      store.state[0].done = false
    })

    expect(result.current).toBe(false)
  })
})
