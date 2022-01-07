import Repository from "@arborjs/repository"
import Arbor, { MutationMode } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArbor from "./useArbor"

interface User {
  name: string
}

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

    const initialProps = {
      store,
      selector: (users: User[]) => users[1],
    }

    const { result, rerender } = renderHook(
      (props) => useArbor(props.store, props.selector),
      { initialProps }
    )

    rerender({
      store,
      selector: (users: User[]) => users[1],
    })

    expect(result.all.length).toBe(2)
    expect(result.all[0]).toBe(result.all[1])
  })

  it("supports derived data", () => {
    const store = new Arbor<User[]>([{ name: "Bob" }, { name: "Alice" }])

    const { result } = renderHook(() =>
      useArbor(store, (users) => users.length)
    )

    expect(result.current).toBe(2)
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

  describe("supports 'Repository' wrapped stores", () => {
    it("returns the current state tree", () => {
      const respository = new Repository<User>({
        "1": { id: "1", name: "Alice" },
        "2": { id: "2", name: "Bob" },
      })

      const { result } = renderHook(() => useArbor(respository))

      expect(result.current).toBe(respository.store.root)
    })

    it("still allows selecting a specific path within the state tree to bind the component to", () => {
      const respository = new Repository<User>({
        "1": { id: "1", name: "Alice" },
        "2": { id: "2", name: "Bob" },
      })

      const { result } = renderHook(() =>
        useArbor(respository, (root) => root["2"])
      )

      expect(result.current).toBe(respository.store.root["2"])
    })

    it("recomputes the state whenever the repository triggers a mutation", () => {
      const repository = new Repository<User>({
        "1": { id: "1", name: "Alice" },
        "2": { id: "2", name: "Bob" },
      })

      const { result } = renderHook(() => useArbor(repository))

      act(() => {
        repository.delete("1")
      })

      expect(result.current).toEqual({
        "2": { id: "2", name: "Bob" },
      })
    })
  })
})
