import Arbor from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArbor from "./useArbor"
import { watchPaths } from "./watchPaths"

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

describe("watchPaths", () => {
  it("does not update if mutation does not match the watched paths", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ]
    })

    const { result } = renderHook(() => useArbor(store.state.users, watchPaths("/users/0", "/users/1/posts")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.push({ name: "Carol", age: 25, posts: [] })
      store.state.users[0].posts[0].content = "Updated post"
      store.state.users[1].posts[0].content = "Another updated post"
      store.state.users[1].name = "Bob Updated"
      store.state.users[1].age++
      store.setState({} as State)
    })

    expect(result.all.length).toBe(1)
  })

  it("updates when mutation matches the watched paths", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ]
    })

    const { result } = renderHook(() => useArbor(store.state.users, watchPaths("/users/0", "/users/1/posts")))

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
      store.state.users[0].posts = []
    })

    expect(result.all.length).toBe(4)

    act(() => {
      store.state.users[1].posts.push({ content: "New post" })
    })

    expect(result.all.length).toBe(5)
  })

  it("allows watching specific props as part of the path pattern", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ]
    })

    const { result } = renderHook(() => useArbor(store.state.users, watchPaths("/users/0/#name", "/users/1/#age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].name = "Alice Updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].age++
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].posts = []
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[1].name = "Bob updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[1].age++
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.state.users[1].posts = []
    })

    expect(result.all.length).toBe(3)
  })

  it("allows watching specific props as part of the path patterns with wildcards", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ]
    })

    const { result } = renderHook(() => useArbor(store.state.users, watchPaths("/users/:any/#name", "/users/1/#age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].name = "Alice Updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].age++
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].posts = []
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[1].name = "Bob updated"
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.state.users[1].age++
    })

    expect(result.all.length).toBe(4)

    act(() => {
      store.state.users[1].posts = []
    })

    expect(result.all.length).toBe(4)
  })
})
