import Arbor, { Collection, Repository } from "@arborjs/store"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useArbor from "./useArbor"
import { watchCollectionItemProps } from "./watchCollectionItemProps"

interface Post {
  content: string
}

interface User {
  uuid: string
  name: string
  age: number
  posts: Post[]
}

interface State {
  users: User[]
}

describe("watchCollectionItemProps", () => {
  it("triggers an update when mutation targets the collection node itself", () => {
    const store = new Arbor(new Collection(
      { uuid: "123", name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
      { uuid: "321", name: "Bob", age: 30, posts: [{ content: "My first post" }] },
    ))

    const { result } = renderHook(() => useArbor(store.root, watchCollectionItemProps<User>("name", "age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.setRoot(new Collection<User>())
    })

    expect(result.all.length).toBe(2)
  })

  it("triggers an update when mutation targets the collection's 'items' prop", () => {
    const store = new Arbor(new Collection(
      { uuid: "123", name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
      { uuid: "321", name: "Bob", age: 30, posts: [{ content: "My first post" }] },
    ))

    const { result } = renderHook(() => useArbor(store.root, watchCollectionItemProps<User>("name", "age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.items = new Repository<User>()
    })

    expect(result.all.length).toBe(2)
  })

  it("triggers an update when mutation targets an item's prop being watched", () => {
    const store = new Arbor(new Collection(
      { uuid: "123", name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
      { uuid: "321", name: "Bob", age: 30, posts: [{ content: "My first post" }] },
    ))

    const { result } = renderHook(() => useArbor(store.root, watchCollectionItemProps<User>("name", "age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.items["123"].name = "Alice Updated"
    })

    expect(result.all.length).toBe(2)

    act(() => {
      store.root.items["321"].name = "Bob Updated"
    })

    expect(result.all.length).toBe(3)

    act(() => {
      store.root.items["123"].age++
    })

    expect(result.all.length).toBe(4)

    act(() => {
      store.root.items["321"].age++
    })

    expect(result.all.length).toBe(5)
  })

  it("does not trigger an update when mutation does not target item's prop being watched", () => {
    const store = new Arbor(new Collection(
      { uuid: "123", name: "Alice", age: 20, posts: [{ content: "Hello World" }] },
      { uuid: "321", name: "Bob", age: 30, posts: [{ content: "My first post" }] },
    ))

    const { result } = renderHook(() => useArbor(store.root, watchCollectionItemProps<User>("name", "age")))

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.items["123"].posts[0].content = "Content updated"
    })

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.items["321"].posts[0].content = "Content updated"
    })

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.items["123"].posts = []
    })

    expect(result.all.length).toBe(1)

    act(() => {
      store.root.items["321"].posts = []
    })

    expect(result.all.length).toBe(1)
  })
})
