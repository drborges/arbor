import { Arbor, proxiable } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react"

import { useArbor } from "./useArbor"
import { watchNode } from "./watchNode"

interface Post {
  content: string
}

interface User {
  name: string
  age: number
  posts: Post[]
}

interface State {
  users: User[]
}

describe("watchNode", () => {
  it("does not update if mutation does not targets the given node", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const alice = store.state.users[0]

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchNode("name"))
    )

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users.push({ name: "Carol", age: 25, posts: [] })
    })

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users[1].name = "Bob Updated"
    })

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users[1].posts[0].content = "My first updated post"
    })

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users = []
    })

    expect(result.current).toBe(alice)
  })

  it("does not update if mutation does not change any of the node props being watched", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchNode("name"))
    )

    const alice = store.state.users[0]

    act(() => {
      store.state.users[0].posts.push({ content: "New post" })
    })

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users[0].posts[0].content = "Updated content"
    })

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users[0].age++
    })

    expect(result.current).toBe(alice)

    act(() => {
      store.state.users[0].name = "Alice Doe"
    })

    expect(result.current).not.toBe(alice)
    expect(result.current).toEqual({
      name: "Alice Doe",
      age: 21,
      posts: [{ content: "Updated content" }, { content: "New post" }],
    })
  })

  it("watches a prop of a proxiable node", () => {
    @proxiable
    class User {
      name = "Alice"
      age = 20
    }

    const store = new Arbor(new User())
    const user = store.state

    const { result } = renderHook(() => useArbor(store, watchNode("name")))

    expect(result.current).toBe(user)

    act(() => {
      store.state.age++
    })

    expect(result.current).toBe(user)

    act(() => {
      store.state.name = "Alice Doe"
    })

    expect(result.current).not.toBe(user)
    expect(result.current.name).toEqual("Alice Doe")
    expect(result.current.age).toEqual(21)
  })

  it("watches for any node mutation", () => {
    @proxiable
    class User {
      name = "Alice"
      age = 20
    }

    const store = new Arbor(new User())
    let user = store.state

    const { result } = renderHook(() => useArbor(store, watchNode()))

    expect(result.current).toBe(user)

    act(() => {
      store.state.age++
    })

    expect(result.current).toBe(store.state)
    expect(result.current).not.toBe(user)
    expect(result.current.name).toEqual("Alice")
    expect(result.current.age).toEqual(21)

    user = store.state

    act(() => {
      store.state.name = "Alice Doe"
    })

    expect(result.current).toBe(store.state)
    expect(result.current).not.toBe(user)
    expect(result.current.name).toEqual("Alice Doe")
    expect(result.current.age).toEqual(21)
  })
})
