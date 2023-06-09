/* eslint-disable max-classes-per-file */
import { Arbor, Proxiable } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks"

import useArbor from "./useArbor"
import { watchChildren } from "./watchChildren"

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

describe("watchChildren", () => {
  it("does not update if mutation does not target any of the listed children props", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchChildren("name", "age"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].posts[0].content = "Updated post"
      store.state.users[1].posts[0].content = "Another updated post"
      store.state.users[0].posts = []
      store.state.users[1].posts = []
      store.state.users = []
      store.setState({} as State)
    })

    expect(result.all.length).toBe(1)
  })

  it("allow watching props of a given object", () => {
    const store = new Arbor({
      user: {
        uuid: "123",
        name: "Alice",
        age: 30,
      },
    })

    const { result } = renderHook(() => useArbor(store, watchChildren("name")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.user.name = "Alice updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.user.age++
    })

    expect(result.all.length).toBe(2)
  })

  it("allow watching props of children of a custom node type", () => {
    @Proxiable()
    class Preference {
      email = false
      sms = false
    }

    @Proxiable()
    class User {
      name: string
      preference = new Preference()
    }

    const store = new Arbor(new User())

    const { result } = renderHook(() => useArbor(store, watchChildren("email")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.preference.email = true
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.preference.sms = true
    })

    expect(result.all.length).toBe(2)
  })

  it("updates when mutation targets the node being watched", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchChildren("name", "age"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.push({ name: "Carol", age: 25, posts: [] })
    })

    expect(result.all.length).toBe(2)
  })

  it("updates if mutation targets any of the listed children props", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchChildren("name", "age"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].name = "Alice updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].age++
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.state.users[1].name = "Bob updated"
    })

    expect(result.all.length).toBe(4)

    act(() => {
      store.state.users[1].age++
    })

    expect(result.all.length).toBe(5)
  })

  it("updates if child node is detached from the state tree", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchChildren())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      delete store.state.users[0]
    })

    expect(result.all.length).toBe(2)
  })

  it("updates if a new child node is attached to the state tree", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchChildren())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.push({
        name: "Carol",
        age: 20,
        posts: [],
      })
    })

    expect(result.all.length).toBe(2)
  })

  it("updates if mutation targets any props", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ],
    })

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchChildren())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users[0].name = "Alice updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users[0].age++
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.state.users[0].posts.push({ content: "new post" })
    })

    expect(result.all.length).toBe(4)

    act(() => {
      store.state.users[0].posts[0].content = "Updated content"
    })

    expect(result.all.length).toBe(5)

    act(() => {
      store.state.users[1].name = "Bob updated"
    })

    expect(result.all.length).toBe(6)

    act(() => {
      store.state.users[1].age++
    })

    expect(result.all.length).toBe(7)
  })
})
