import Arbor, { MutationMode } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArborNode from "./useArborNode"

describe("useArborNode", () => {
  it("subscribed data is simply a reference to the store's root object", () => {
    const store = new Arbor({
      counter: {
        count: 0,
      },
    })

    const { result } = renderHook(() => useArborNode(store.root.counter))

    expect(result.current).toBe(store.root.counter)
  })

  it("updates the state whenever a store mutation is triggered", () => {
    const store = new Arbor({
      counter: {
        count: 0,
      },
    })

    const { result } = renderHook(() => useArborNode(store.root.counter))

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

  it("updates its internal state when initial state changes", () => {
    const store = new Arbor({
      counter1: {
        count: 0,
      },
      counter2: {
        count: 1,
      },
    })

    const { result, rerender } = renderHook(({ node }) => useArborNode(node), {
      initialProps: { node: store.root.counter1 },
    })

    expect(result.current.count).toBe(0)

    rerender({ node: store.root.counter2 })

    expect(result.current.count).toBe(1)
  })

  it("does not trigger a state update when selected state is not changed", () => {
    const store = new Arbor({
      counter1: {
        count: 0,
      },
      counter2: {
        count: 0,
      },
    })

    const { result } = renderHook(() => useArborNode(store.root.counter1))

    expect(result.all.length).toBe(1)
    expect(result.current).toBe(store.root.counter1)

    act(() => {
      store.root.counter2.count++
    })

    expect(result.all.length).toBe(1)
    expect(result.current).toBe(store.root.counter1)

    act(() => {
      store.root.counter1.count++
    })

    expect(result.all.length).toBe(2)
    expect(result.current).toBe(store.root.counter1)
  })

  it("when running forgiven mutation mode, subsequent mutations to the same path can be triggered off the same node reference", () => {
    const state = { counter: { count: 0 } }
    const store = new Arbor(state, { mode: MutationMode.FORGIVEN })
    const { result } = renderHook(() => useArborNode(store.root.counter))

    expect(result.current.count).toBe(0)

    act(() => {
      result.current.count++
      result.current.count++
    })

    expect(result.current.count).toBe(2)
  })

  it("unsubscribes from store when component is unmounted", () => {
    const store = new Arbor({
      counter: {
        count: 0,
      },
    })

    const { result, unmount } = renderHook(() =>
      useArborNode(store.root.counter)
    )

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

  it("throws an error when attemoting to initialize the hook with any value other than an Arbor Node", () => {
    expect(() => useArborNode({ not: "an arbor node" })).toThrowError(
      "useArborNode must be initialized with an Arbor Node"
    )
  })
})
