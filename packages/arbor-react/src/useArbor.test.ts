import Arbor, { MutationMode } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArbor from "./useArbor"

describe("useArbor", () => {
  it("updates the state whenever a store mutation is triggered", () => {
    const store = new Arbor({
      count: 0,
    })

    const { result } = renderHook(() => useArbor(store))

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

  it("when running forgiven mutation mode, subsequent mutations can be triggered off the same node reference", () => {
    const state = { count: 0 }
    const store = new Arbor(state, { mode: MutationMode.FORGIVEN })
    const { result } = renderHook(() => useArbor(store))

    expect(result.current.count).toBe(0)

    act(() => {
      result.current.count++
      result.current.count++
    })

    expect(result.current.count).toBe(2)
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
})
