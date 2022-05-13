import Arbor from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArbor from "./useArbor"
import { watchAnyMutations } from "./watchAnyMutations"

describe("watchAnyMutations", () => {
  it("does not update if mutation does not affect the given node", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", posts: [{ content: "Hello World" }] },
        { name: "Bob", posts: [{ content: "My first post" }] },
      ]
    })

    const { result } = renderHook(() => useArbor(store.root.users[0], watchAnyMutations()))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.users.push({ name: "Carol", posts: [] })
      store.root.users[1].name = "Bob Updated"
      store.root.users[1].posts[0].content = "My first updated post"
    })

    expect(result.all.length).toBe(1)
  })

  it("updates when mutation affects the given node", () => {
    const store = new Arbor({
      users: [
        { name: "Alice", posts: [{ content: "Hello World" }] },
        { name: "Bob", posts: [{ content: "My first post" }] },
      ]
    })

    const { result } = renderHook(() => useArbor(store.root.users[0], watchAnyMutations()))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.users[0].name = "Alice Updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.root.users[0].posts[0].content = "Updated Hello World"
    })

    expect(result.all.length).toBe(3)
  })
})
