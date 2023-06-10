/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-classes-per-file */
import { Arbor } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks"

import useArbor from "./useArbor"
import { watchMapItems } from "./watchMapItems"

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

describe("watchMapItems of a Map", () => {
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

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchMapItems("name", "age"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.get("a")!.posts[0].content = "Updated post"
      store.state.users.get("b")!.posts[0].content = "Another updated post"
      store.state.users.get("a")!.posts = []
      store.state.users.get("b")!.posts = []
      store.state.users = new Users()
      store.setState({} as State)
    })

    expect(result.all.length).toBe(1)
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

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchMapItems("name", "age"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.push({ id: "c", name: "Carol", age: 25, posts: [] })
    })

    expect(result.all.length).toBe(2)
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

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchMapItems("name", "age"))
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.get("a")!.name = "Alice updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users.get("a")!.age++
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.state.users.get("b")!.name = "Bob updated"
    })

    expect(result.all.length).toBe(4)

    act(() => {
      store.state.users.get("b")!.age++
    })

    expect(result.all.length).toBe(5)
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

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchMapItems())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.delete("a")
    })

    expect(result.all.length).toBe(2)
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

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchMapItems())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.push({
        id: "c",
        name: "Carol",
        age: 20,
        posts: [],
      })
    })

    expect(result.all.length).toBe(2)
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

    const { result } = renderHook(() =>
      useArbor(store.state.users, watchMapItems())
    )

    expect(result.all.length).toBe(1)

    act(() => {
      store.state.users.get("a")!.name = "Alice updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.state.users.get("a")!.age++
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.state.users.get("a")!.posts.push({ content: "new post" })
    })

    expect(result.all.length).toBe(4)

    act(() => {
      store.state.users.get("a")!.posts[0].content = "Updated content"
    })

    expect(result.all.length).toBe(5)

    act(() => {
      store.state.users.get("b")!.name = "Bob updated"
    })

    expect(result.all.length).toBe(6)

    act(() => {
      store.state.users.get("b")!.age++
    })

    expect(result.all.length).toBe(7)
  })
})
