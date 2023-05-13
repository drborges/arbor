import Arbor from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks"

import useArbor from "./useArbor"
import { watchAny } from "./watchAny"

describe("watchAny", () => {
  it("does not update if mutation does not affect the given node", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", posts: [{ content: "Hello World" }] },
        { name: "Bob", posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchAny())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.push({ name: "Carol", posts: [] })
      store.state.users[1].name = "Bob Updated"
      store.state.users[1].posts[0].content = "My first updated post"
    })

    expect(result.all.length).toBe(1)
  })

  it("updates when mutation affects the given node", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", posts: [{ content: "Hello World" }] },
        { name: "Bob", posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchAny())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].name = "Alice Updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].posts[0].content = "Updated Hello World"
    })

    expect(result.all.length).toBe(3)
  })
})
