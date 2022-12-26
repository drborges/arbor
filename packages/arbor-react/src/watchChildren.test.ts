import Arbor from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

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
      ]
    })

    const { result } = renderHook(() => useArbor(store.root.users, watchChildren<User>("name", "age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.users[0].posts[0].content = "Updated post"
      store.root.users[1].posts[0].content = "Another updated post"
      store.root.users[0].posts = []
      store.root.users[1].posts = []
      store.root.users = []
      store.setRoot({} as State)
    })

    expect(result.all.length).toBe(1)
  })

  it("updates when mutation targets the node being watched", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ]
    })

    const { result } = renderHook(() => useArbor(store.root.users, watchChildren<User>("name", "age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.users.push({ name: "Carol", age: 25, posts: [] })
    })

    expect(result.all.length).toBe(2)
  })

  it("updates if mutation targets any of the listed children props", () => {
    const store = new Arbor<State>({
      users: [
        { name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
        { name: "Bob", age: 30, posts: [{ content: "My first post" }] },
      ]
    })

    const { result } = renderHook(() => useArbor(store.root.users, watchChildren<User>("name", "age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.users[0].name = "Alice updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.root.users[0].age++
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.root.users[1].name = "Bob updated"
    })

    expect(result.all.length).toBe(4)

    act(() => {
      store.root.users[1].age++
    })

    expect(result.all.length).toBe(5)
  })
})
