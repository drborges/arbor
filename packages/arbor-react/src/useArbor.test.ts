import Arbor, { BaseNode, MutationMode } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArbor from "./useArbor"

interface User {
  name: string
}

describe("useArbor", () => {
  it("subscribed data is simply a reference to the store's root object", () => {
    const store = new Arbor({
      count: 0,
    })

    const { result } = renderHook(() => useArbor(store))

    expect(result.current).toBe(store.root)
  })

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

  it("subscribes to changes to a specific tree node", () => {
    const store = new Arbor<User[]>([{ name: "Bob" }, { name: "Alice" }])

    const user1 = store.root[0]
    const user2 = store.root[1]

    const { result } = renderHook(() => useArbor(store, (users) => users[1]))

    expect(result.current).toBe(user2)

    act(() => {
      user1.name = "Bob Updated"
    })

    expect(result.current).toBe(user2)

    act(() => {
      user2.name = "Alice Updated"
    })

    expect(result.current).not.toBe(user2)
    expect(result.current).toEqual({ name: "Alice Updated" })
  })

  it("handles selector changes across re-renderings", () => {
    const store = new Arbor<User[]>([{ name: "Bob" }, { name: "Alice" }])

    const initialProps = {
      store,
      selector: (users: User[]) => users[2],
    }

    const { result, rerender } = renderHook(
      (props) => useArbor(props.store, props.selector),
      { initialProps }
    )

    expect(result.current).toBe(undefined)

    rerender({
      store,
      selector: (users: User[]) => users[1],
    })

    expect(result.current).toBe(store.root[1])
  })

  it("does not trigger a state update when selected state is not changed", () => {
    const store = new Arbor<User[]>([{ name: "Bob" }, { name: "Alice" }])

    const { result } = renderHook(() =>
      useArbor(store, (users: User[]) => users[1])
    )

    expect(result.all.length).toBe(1)
    expect(result.current).toBe(store.root[1])

    act(() => {
      store.root[0].name = "Bobz"
    })

    expect(result.all.length).toBe(1)
    expect(result.current).toBe(store.root[1])

    act(() => {
      store.root[1].name = "Alicez"
    })

    expect(result.all.length).toBe(2)
    expect(result.current).toBe(store.root[1])
  })

  it("supports derived data", () => {
    const store = new Arbor<User[]>([{ name: "Bob" }, { name: "Alice" }])

    const { result } = renderHook(() =>
      useArbor(store, (users) => users.length)
    )

    expect(result.current).toBe(2)
  })

  it("when running forgiven mutation mode, subsequent mutations to the same path can be triggered off the same node reference", () => {
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
    class InputHandler extends BaseNode<InputHandler> {
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

  it("throws an error when attemoting to initialize the hook with any value other than a literal object or an instance of Arbor", () => {
    expect(() => useArbor(new Date())).toThrowError(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )

    expect(() => useArbor("No strings allowed" as any)).toThrowError(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )
  })
})
