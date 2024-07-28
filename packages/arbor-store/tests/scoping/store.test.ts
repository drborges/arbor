import { describe, expect, it, vi } from "vitest"
import { Arbor } from "../../src/arbor"
import { proxiable, detached } from "../../src/decorators"
import { ScopedStore } from "../../src/scoping/store"
import { unwrap } from "../../src/utilities"

describe("path tracking", () => {
  it("leverages structural sharing to preserve identities of nodes in the state tree", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ],
    })

    const scopedStore = new ScopedStore(store)
    const root = scopedStore.state
    const todos = scopedStore.state.todos
    const todo0 = scopedStore.state.todos[0]
    const todo1 = scopedStore.state.todos[1]

    todo0.active = true

    expect(root).not.toBe(scopedStore.state)
    expect(todos).not.toBe(scopedStore.state.todos)
    expect(todo0).not.toBe(scopedStore.state.todos[0])
    expect(todo1).toBe(scopedStore.state.todos[1])

    expect(root).toEqual(scopedStore.state)
    expect(todos).toEqual(scopedStore.state.todos)
    expect(todo0).toEqual(scopedStore.state.todos[0])
  })

  it("reacts to mutations targeting paths being tracked", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ],
    })

    const subscriber = vi.fn()
    const scopedStore = new ScopedStore(store)

    scopedStore.subscribe(subscriber)

    // Tracks the following store paths
    //  1. scopedStore.state.todos
    //  2. scopedStore.state.todos[0]
    //  2. scopedStore.state.todos[0].active
    scopedStore.state.todos[0].active

    // Does not notifies scopedStore subscribers
    store.state.todos[0].id = 3
    store.state.todos[0].text = "Do the dishes again"
    // Does not notifies scopedStore subscribers
    store.state.todos[1].id = 4
    store.state.todos[1].text = "Walk the dogs again"
    store.state.todos[1].active = false
    store.state.todos[1] = { id: 3, text: "Clean the house", active: false }

    expect(subscriber).not.toHaveBeenCalled()

    store.state.todos[0].active = true
    store.state.todos[0] = { id: 3, text: "Clean the house", active: false }
    store.state.todos = []

    expect(subscriber).toHaveBeenCalledTimes(3)
  })

  it("reacts to mutations targeting the root of the state tree", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ],
    })

    const subscriber = vi.fn()
    const scopedStore = new ScopedStore(store)

    scopedStore.subscribe(subscriber)

    store.setState({ todos: [] })

    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it("marks nodes as tracked", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ],
    })

    const scopedStore1 = new ScopedStore(store)

    expect(scopedStore1.state).toBeTrackedNode()
    expect(scopedStore1.state.todos).toBeTrackedNode()
    expect(scopedStore1.state.todos[0]).toBeTrackedNode()
    expect(scopedStore1.state.todos[1]).toBeTrackedNode()
  })

  it("automatically unwraps tracked node when creating a derived tracking scope", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ],
    })

    const scopedStore1 = new ScopedStore(store)

    expect(scopedStore1.state).toEqual(store.state)
    expect(scopedStore1.state).not.toBe(store.state)
    expect(unwrap(scopedStore1.state)).toBe(store.state)

    const scopedStore2 = new ScopedStore(scopedStore1.state.todos[0])

    expect(scopedStore2.state).toEqual(store.state.todos[0])
    expect(scopedStore2.state).not.toBe(store.state.todos[0])
    expect(scopedStore2.state).not.toBe(scopedStore1.state.todos[0])
    expect(unwrap(scopedStore2.state)).toBe(store.state.todos[0])
  })

  it("isolates subscriptions to their own tracking scope", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ],
    })

    const subscriber1 = vi.fn()
    const subscriber2 = vi.fn()

    const scopedStore1 = new ScopedStore(store)
    scopedStore1.subscribe(subscriber1)

    // Causes scopedStore1 to watch mutations to the following paths:
    // 1. root
    // 2. root.todos
    // 3. root.todos[0]
    const firstTodo = scopedStore1.state.todos[0]

    const scopedStore2 = new ScopedStore(firstTodo)
    scopedStore2.subscribe(subscriber2)

    // Causes scopedStore2 to watch mutations to the following paths but does not affect scopedStore1:
    // 1. root.todos[0].active
    scopedStore2.state.active = true

    expect(subscriber1).not.toHaveBeenCalled()
    expect(subscriber2).toHaveBeenCalledTimes(1)

    scopedStore1.state.todos[2] = {
      id: 3,
      text: "Learn Arbor",
      active: true,
    }

    expect(subscriber1).toHaveBeenCalledTimes(1)
    expect(subscriber2).toHaveBeenCalledTimes(1)
  })

  it("is able to track nodes resulted from method calls", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes", active: false },
        { id: 2, text: "Walk the dogs", active: true },
      ],
    })

    const scopedStore = new ScopedStore(store)

    const activeTodo = scopedStore.state.todos.find((t) => t.active)

    expect(activeTodo).toBeTrackedNode()
    expect(activeTodo).toBe(scopedStore.state.todos[1])
  })

  it("handles mutations to the root of the store", () => {
    const store = new Arbor([
      { id: 1, text: "Do the dishes", active: false },
      { id: 2, text: "Walk the dogs", active: true },
    ])

    const subscriber = vi.fn()
    const scopedStore = new ScopedStore(store)
    scopedStore.subscribe(subscriber)

    scopedStore.state.push({ id: 3, text: "Walk the dogs", active: true })

    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it("allows tracking a specific node within the state tree", () => {
    const store = new Arbor([
      { id: 1, text: "Do the dishes", active: false },
      { id: 2, text: "Walk the dogs", active: true },
    ])

    const scopedStore = new ScopedStore(store.state[0])

    expect(unwrap(scopedStore.state)).toBe(store.state[0])
  })

  it("creates a virtual state tree from a given subtree", () => {
    const store = new Arbor([
      { id: 1, text: "Do the dishes", active: false },
      { id: 2, text: "Walk the dogs", active: true },
    ])

    const scopedStore = new ScopedStore(store.state[0])

    expect(unwrap(scopedStore.state)).toBe(store.state[0])

    const newState = scopedStore.setState({
      id: 3,
      text: "Learn Arbor",
      active: true,
    })

    expect(unwrap(newState)).toBe(store.state[0])
    expect(newState).toEqual({
      id: 3,
      text: "Learn Arbor",
      active: true,
    })
  })

  it("tracks new array items being added", () => {
    const store = new Arbor([{ name: "Alice" }, { name: "Bob" }])

    const subscriber = vi.fn()
    const scopedStore = new ScopedStore(store)
    scopedStore.subscribe(subscriber)

    store.state.push({ name: "Carol" })

    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it("tracks new props being added to nodes", () => {
    const store = new Arbor({ users: [{ name: "Alice" }, { name: "Bob" }] })

    const subscriber = vi.fn()
    const scopedStore = new ScopedStore(store)
    scopedStore.subscribe(subscriber)

    // track state.users
    scopedStore.state.users[1]

    store.state.users[2] = { name: "Carol" }

    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it("preserves children node path tracking when plucking them through a method operation (like filter, map, etc...)", () => {
    const store = new Arbor([
      { name: "Carol", active: true },
      { name: "Alice", active: false },
    ])
    const tracked = new ScopedStore(store.state)

    store.state.filter // binds filter to the original store
    const filterBoundToTrackedStore = tracked.state.filter
    const activeUsers = filterBoundToTrackedStore((u) => u.active)

    expect(activeUsers[0]).toBeTrackedNode()
  })

  it("preserves path tracking on nodes 'plucked' from the state tree", () => {
    const store = new Arbor([
      { name: "Carol", active: true },
      { name: "Alice", active: false },
    ])
    const tracked = new ScopedStore(store.state)
    const subscriber = vi.fn()

    tracked.subscribe(subscriber)

    const carol = tracked.state[0]

    carol.active = false

    expect(carol).toBeTrackedNode()
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it("can track path access on nodes 'pluck' from the state tree", () => {
    const store = new Arbor({
      users: [
        { name: "Carol", active: true },
        { name: "Alice", active: false },
      ],
    })
    const tracked = new ScopedStore(store)

    const carol = tracked.state.users[0]
    expect(carol).toBeTrackedNode()
  })

  it("ensure node methods have stable memory reference across updates", () => {
    const store = new Arbor({
      todos: ["Do the dishes"],
      users: ["Carol", "Alice"],
    })

    const tracked = new ScopedStore(store)
    const userFilter = tracked.state.users.filter

    expect(userFilter).toBe(tracked.state.users.filter)

    tracked.state.todos[0] = "Clean the house"

    expect(userFilter).toBe(tracked.state.users.filter)

    tracked.state.users.push("Bob")

    expect(userFilter).toBe(tracked.state.users.filter)
  })

  it("can safely use a method reference across node updates", () => {
    const store = new Arbor({
      users: [
        { name: "Carol", active: true },
        { name: "Alice", active: false },
      ],
    })

    const tracked = new ScopedStore(store)
    const userFilter = tracked.state.users.filter

    expect(userFilter((u) => u.active)).toEqual([
      { name: "Carol", active: true },
    ])

    store.state.users[1].active = true

    expect(userFilter((u) => u.active)).toEqual([
      { name: "Carol", active: true },
      { name: "Alice", active: true },
    ])

    store.state.users[0].active = false

    expect(userFilter((u) => u.active)).toEqual([
      { name: "Alice", active: true },
    ])
  })

  it("can handle null props", () => {
    const store = new Arbor({ name: "Carol", email: null })
    const tracked = new ScopedStore(store.state)

    expect(tracked.state.email).toBeNull()
  })

  it("does not track detached props", () => {
    @proxiable
    class SomeNode {
      @detached untrackedProp = "untracked"
      trackedProp = "tracked"
    }

    const store = new ScopedStore(new Arbor(new SomeNode()))

    store.state.untrackedProp
    store.state.trackedProp

    expect(store.scope.isTracking(store.state, "trackedProp")).toBe(true)
    expect(store.scope.isTracking(store.state, "untrackedProp")).toBe(false)
  })

  it("binds methods to the path tracking proxy", () => {
    @proxiable
    class Todo {
      constructor(public text = "") {}
    }

    @proxiable
    class TodoApp {
      todos: Todo[] = []

      removeTodo(todo) {
        this.todos = this.todos.filter((t) => t !== todo)
      }
    }

    const store = new ScopedStore(new Arbor(new TodoApp()))
    const subscriber = vi.fn()

    store.subscribe(subscriber)

    const state = store.state
    state.todos = [new Todo("Do the dishes"), new Todo("Clean the house")]
    state.removeTodo(state.todos[0])
    state.todos.push(new Todo("Walk the dogs"))

    expect(subscriber.mock.calls.length).toBe(3)
    expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("set")
    expect(subscriber.mock.calls[1][0].metadata.operation).toEqual("set")
    expect(subscriber.mock.calls[2][0].metadata.operation).toEqual("push")
  })

  it("binds methods to the instance of the node they belong to", () => {
    @proxiable
    class Todo {
      constructor(public text = "", public done = false) {}

      toggle() {
        this.done = !this.done
      }
    }

    @proxiable
    class TodoApp {
      todos: Todo[] = []
    }

    const store = new ScopedStore(new Arbor(new TodoApp()))
    const subscriber = vi.fn()

    store.subscribe(subscriber)

    const state = store.state
    state.todos = [new Todo("Do the dishes"), new Todo("Clean the house")]

    state.todos[0].toggle()
    state.todos[1].toggle()

    expect(state.todos[0].done).toBe(true)
    expect(state.todos[1].done).toBe(true)
  })

  it("prevents object methods from conflicting with the Proxy API", () => {
    @proxiable
    class NumberList {
      items: number[] = []

      get(index: number) {
        return this.items[index]
      }

      set(index: number, value: number) {
        this.items[index] = value
      }

      deleteProperty(index: number) {
        this.items.splice(index, 1)
      }
    }

    const todos = new ScopedStore(new Arbor(new NumberList()))

    todos.state.set(0, 1)
    todos.state.set(1, 2)
    expect(todos.state.get(0)).toBe(1)
    expect(todos.state.get(1)).toBe(2)
    todos.state.deleteProperty(0)
    expect(todos.state.get(0)).toBe(2)
    expect(todos.state.get(1)).toBeUndefined()
  })

  it("does not proxy instances of Arbor when used as fields of a store", () => {
    const store1 = new Arbor<Array<{ text: string }>>([
      { text: "Do the dishes" },
    ])

    @proxiable
    class Form {
      constructor(readonly store = store1) {}

      addTodo(text: string) {
        this.store.state.push({ text })
      }
    }

    const store2 = new ScopedStore(new Arbor(new Form(store1)))

    store2.state.addTodo("LOL")

    expect(store1.state).toEqual([{ text: "Do the dishes" }, { text: "LOL" }])
  })

  it("track nodes accessed through a getter", () => {
    @proxiable
    class TodoApp {
      todos = [
        { text: "Do the dishes", done: false },
        { text: "Walk the dogs", done: true },
      ]

      get activeTodos() {
        return this.todos.filter((todo) => !todo.done)
      }
    }

    const scoped = new ScopedStore(new Arbor(new TodoApp()))
    const todo = scoped.state.activeTodos[0]

    expect(scoped).toBeTracking(todo, "done")
    expect(scoped).not.toBeTracking(todo, "text")

    // access the first todo in the result so the scoped store
    // start tracking changes to the todo's "text" prop.
    todo.text

    expect(scoped).toBeTracking(todo, "text")
  })
})
