import { act, renderHook } from "@testing-library/react-hooks/native"

import useArborState from "./useArborState"

describe("useArborState", () => {
  it("updates the state whenever a store mutation is triggered", () => {
    const { result } = renderHook(() => useArborState({ count: 2 }))
    const counter1 = result.current

    expect(result.current.count).toBe(2)

    act(() => {
      result.current.count++
    })

    const counter2 = result.current
    expect(counter2).not.toBe(counter1)
    expect(result.current.count).toBe(3)

    act(() => {
      result.current.count = 5
    })

    const counter3 = result.current
    expect(counter3).not.toBe(counter1)
    expect(counter3).not.toBe(counter2)
    expect(result.current.count).toBe(5)
  })

  it("memoizes store across re-render calls", () => {
    const { result, rerender } = renderHook(() => useArborState({ count: 3 }))
    const counter = result.current

    expect(result.current.count).toBe(3)

    rerender()

    expect(result.current).toBe(counter)
  })
})
