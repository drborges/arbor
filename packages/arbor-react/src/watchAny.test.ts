import { Arbor } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react"

import { useArbor } from "./useArbor"
import { watchAny } from "./watchAny"

describe("watchAny", () => {
  it("does not update if mutation does not affect the given node", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", posts: [{ content: "Hello World" }] },
        { name: "Bob", posts: [{ content: "My first post" }] },
      ],
    })

    const alice = store.state.users[0]

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchAny())
    )

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users.push({ name: "Carol", posts: [] })
      store.state.users[1].name = "Bob Updated"
      store.state.users[1].posts[0].content = "My first updated post"
    })

    expect(result.current).toBe(alice)
  })

  it("updates when mutation affects the given node", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", posts: [{ content: "Hello World" }] },
        { name: "Bob", posts: [{ content: "My first post" }] },
      ],
    })

    let alice = store.state.users[0]

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchAny())
    )

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users[0].name = "Alice Updated"
    })

    expect(result.current).not.toBe(alice)
    expect(result.current).toEqual({
      name: "Alice Updated",
      posts: [{ content: "Hello World" }],
    })

    alice = store.state.users[0]

    act(() => {
      store.state.users[0].posts[0].content = "Updated Hello World"
    })

    expect(result.current).not.toBe(alice)
    expect(result.current).toEqual({
      name: "Alice Updated",
      posts: [{ content: "Updated Hello World" }],
    })
  })
})
