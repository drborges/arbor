import { Arbor, BaseNode } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks"

import useArbor from "./useArbor"
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

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchNode("name"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.push({ name: "Carol", age: 25, posts: [] })
      store.state.users[0].posts.push({ content: "New post" })
      store.state.users[0].posts[0].content = "Updated content"
      store.state.users[1].name = "Bob Updated"
      store.state.users[1].posts[0].content = "My first updated post"
      store.state.users = []
    })

    expect(result.all.length).toBe(1)
  })

  it("does not update if mutation does not change any of the node props being watched", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchNode("name", "age"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].posts = []
    })

    expect(result.all.length).toBe(1)
  })

  it("updates when mutation targets the given node and any of the watched props change", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchNode("name", "age"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].name = "Alice Updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].age++
    })

    expect(result.all.length).toBe(3)
  })

  it("watches a BseNode value", () => {
    class User extends BaseNode<User> {
      name: string
      age: number
    }
    const store = new Arbor(new User())

    const { result } = renderHook(() => useArbor(store, watchNode("name")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.name = "Alice"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.age++
    })

    expect(result.all.length).toBe(2)
  })

  it("watches for any node mutation", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "some post" }] },
        { name: "Bob", age: 30, posts: [] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users[0], watchNode())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].name = "Alice Updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].age++
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.state.users[0].posts[0].content = "Updated post"
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.state.users[0].posts = []
    })

    expect(result.all.length).toBe(4)
  })
})
