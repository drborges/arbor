import { describe, expect, it, vi } from "vitest"

import debounce from "../src/debounce"

describe("debounce", () => {
  it("calls debounced function at most once within the debounced period", () => {
    vi.useFakeTimers()

    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    expect(fn).toHaveBeenCalledTimes(0)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
