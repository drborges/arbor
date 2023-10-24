/* eslint-disable max-classes-per-file */
import { Arbor } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react"

import { useArbor } from "./useArbor"
import { watchItems } from "./watchItems"

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

describe("watchItems of an Array", () => {
  it("does not update if mutation does not target any of the listed children props", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems("name", "age"))
    )

    expect(result.current).toBe(users)

    act(() => {
      store.state.users[0].posts[0].content = "Updated post"
      store.state.users[1].posts[0].content = "Another updated post"
      store.state.users[0].posts = []
      store.state.users[1].posts = []
      store.state.users = []
      store.setState({} as State)
    })

    expect(result.current).toBe(users)
  })

  it("updates when mutation targets the node being watched", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems("name", "age"))
    )

    expect(result.current).toBe(users)

    act(() => {
      store.state.users.push({ name: "Carol", age: 25, posts: [] })
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)
  })

  it("updates if mutation targets any of the listed children props", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    let users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems("name", "age"))
    )

    expect(result.current).toBe(users)

    act(() => {
      store.state.users[0].name = "Alice updated"
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toEqual([
      { name: "Alice updated", age: 20, posts: [{ content: "Hello World" }] },
      { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
    ])

    users = store.state.users

    act(() => {
      store.state.users[0].age++
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toEqual([
      { name: "Alice updated", age: 21, posts: [{ content: "Hello World" }] },
      { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
    ])

    users = store.state.users

    act(() => {
      store.state.users[1].name = "Bob updated"
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toEqual([
      { name: "Alice updated", age: 21, posts: [{ content: "Hello World" }] },
      { name: "Bob updated", age: 30, posts: [{ content: "My first post" }] },
    ])

    users = store.state.users

    act(() => {
      store.state.users[1].age++
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toEqual([
      { name: "Alice updated", age: 21, posts: [{ content: "Hello World" }] },
      { name: "Bob updated", age: 31, posts: [{ content: "My first post" }] },
    ])
  })

  it("updates when child node is detached from the state tree", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems())
    )

    expect(result.current).toBe(users)

    act(() => {
      delete store.state.users[0]
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)
  })

  it("updates if a new child node is attached to the state tree", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems())
    )

    expect(result.current).toBe(users)

    act(() => {
      store.state.users.push({
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
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    let users = store.state.users

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchItems())
    )

    expect(result.current).toBe(users)

    act(() => {
      store.state.users[0].name = "Alice updated"
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users[0].age++
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users[0].posts.push({ content: "new post" })
    })

    expect(result.current).toBe(users)
    expect(result.current).not.toBe(store.state.users)

    act(() => {
      store.state.users[0].posts[0].content = "Updated content"
    })

    expect(result.current).toBe(users)
    expect(result.current).not.toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users[1].name = "Bob updated"
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)

    users = store.state.users

    act(() => {
      store.state.users[1].age++
    })

    expect(result.current).not.toBe(users)
    expect(result.current).toBe(store.state.users)
  })
})
