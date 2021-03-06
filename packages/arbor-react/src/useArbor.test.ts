import Arbor, { ArborNode, BaseNode, MutationMode, Path } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArbor, { Watcher } from "./useArbor"

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

  it("allows subscribing to specific subtrees of an existing state tree", () => {
    const store = new Arbor({
      users: [{ name: "Alice" }, { name: "Bob" }],
    })

    const { result } = renderHook(() => useArbor(store.root.users[0]))

    expect(result.all.length).toBe(1)
    expect(result.current).toBe(store.root.users[0])

    act(() => {
      result.current.name = "Alice Updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.root.users.push({ name: "Carol" })
    })

    expect(result.all.length).toBe(2)

    expect(store.root.users[0]).toEqual({ name: "Alice Updated" })
  })

  it("allows overriding the state tree watching logic", () => {
    interface State {
      users: User[]
    }

    const store = new Arbor({
      users: [{ name: "Alice" }, { name: "Bob" }],
    })

    // Only updates when changes are made to the state tree path: /users/1
    const watchSecondUser =
      (): Watcher<State> =>
      (_node: ArborNode<State>, { mutationPath }) =>
        mutationPath.targets(Path.parse("/users/1"))

    const { result } = renderHook(() => useArbor(store, watchSecondUser()))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.users[0].name = "Carol"
    })

    expect(store.root.users[0].name).toBe("Carol")
    expect(result.all.length).toBe(1)

    act(() => {
      store.root.users[1].name = "John"
    })

    expect(store.root.users[1].name).toBe("John")
    expect(result.all.length).toBe(2)
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
