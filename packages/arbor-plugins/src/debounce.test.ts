import debounce from "./debounce"

describe("debounce", () => {
  it("calls debounced function at most once within the debounced period", () => {
    jest.useFakeTimers()

    const fn = jest.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    expect(fn).toHaveBeenCalledTimes(0)
    jest.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })
})
