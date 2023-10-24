/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-classes-per-file */
import { Arbor } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react"

import { useArbor } from "./useArbor"
import { watchItems } from "./watchItems"

interface Post {
  content: string
}

interface User {
  id: string
  name: string
  age: number
  posts: Post[]
}

interface State {
  users: Users
}

class Users extends Map<string, User> {
  constructor(...items: User[]) {
    super()

    items.forEach((item) => {
      this.set(item.id, item)
    })
  }

  push(item: User) {
    this.set(item.id, item)
  }
}

describe("watchItems of a Map", () => {
  it("does not update if mutation does not target any of the listed children props", () => {
    const store = new Arbor<State>({
      users: new Users(
        {
          id: "a",
          name: "Alice",
          age: 20,
          posts: [{ content: "Hello World" }],
        },
        { id: "b", name: "Bob", age: 30, posts: [{ content: "My first post" }] }
      ),
    })

    const users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems("name", "age"))
    )

    expect(result.current).toBe(users)

    act(() => {
      store.state.users.get("a")!.posts[0].content = "Updated post"
      store.state.users.get("b")!.posts[0].content = "Another updated post"
      store.state.users.get("a")!.posts = []
      store.state.users.get("b")!.posts = []
      store.state.users = new Users()
      store.setState({} as State)
    })

    expect(result.current).toBe(users)
    expect(result.current).not.toBe(store.state.users)
  })

  it("updates when mutation targets the node being watched", () => {
    const store = new Arbor<State>({
      users: new Users(
        {
          id: "a",
          name: "Alice",
          age: 20,
          posts: [{ content: "Hello World" }],
        },
        { id: "b", name: "Bob", age: 30, posts: [{ content: "My first post" }] }
      ),
    })

    const users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems("name", "age"))
    )

    act(() => {
      store.state.users.push({ id: "c", name: "Carol", age: 25, posts: [] })
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)
  })

  it("updates if mutation targets any of the listed children props", () => {
    const store = new Arbor<State>({
      users: new Users(
        {
          id: "a",
          name: "Alice",
          age: 20,
          posts: [{ content: "Hello World" }],
        },
        { id: "b", name: "Bob", age: 30, posts: [{ content: "My first post" }] }
      ),
    })

    let users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems("name", "age"))
    )

    act(() => {
      store.state.users.get("a")!.name = "Alice updated"
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users.get("a")!.age++
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users.get("b")!.name = "Bob updated"
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users.get("b")!.age++
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)
  })

  it("updates when child node is detached from the state tree", () => {
    const store = new Arbor<State>({
      users: new Users(
        {
          id: "a",
          name: "Alice",
          age: 20,
          posts: [{ content: "Hello World" }],
        },
        { id: "b", name: "Bob", age: 30, posts: [{ content: "My first post" }] }
      ),
    })

    const users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems())
    )

    act(() => {
      store.state.users.delete("a")
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)
  })

  it("updates if a new child node is attached to the state tree", () => {
    const store = new Arbor<State>({
      users: new Users(
        {
          id: "a",
          name: "Alice",
          age: 20,
          posts: [{ content: "Hello World" }],
        },
        { id: "b", name: "Bob", age: 30, posts: [{ content: "My first post" }] }
      ),
    })

    const users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems())
    )

    act(() => {
      store.state.users.push({
        id: "c",
        name: "Carol",
        age: 20,
        posts: [],
      })
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)
  })

  it("updates if mutation targets any props", () => {
    const store = new Arbor<State>({
      users: new Users(
        {
          id: "a",
          name: "Alice",
          age: 20,
          posts: [{ content: "Hello World" }],
        },
        { id: "b", name: "Bob", age: 30, posts: [{ content: "My first post" }] }
      ),
    })

    let users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems())
    )

    act(() => {
      store.state.users.get("a")!.name = "Alice updated"
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users.get("a")!.age++
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users.get("a")!.posts.push({ content: "new post" })
    })

    expect(result.current).toBe(users)
    expect(result.current).not.toBe(store.state.users)

    act(() => {
      store.state.users.get("a")!.posts[0].content = "Updated content"
    })

    expect(result.current).toBe(users)
    expect(result.current).not.toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users.get("b")!.name = "Bob updated"
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users.get("b")!.age++
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)
  })
})
