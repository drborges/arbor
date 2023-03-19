/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import Path from "./Path"
import Arbor, { MutationMode, INode } from "./Arbor"
import BaseNode from "./BaseNode"
import Repository from "./Repository"
import { warmup } from "./test.helpers"
import NodeArrayHandler from "./NodeArrayHandler"
import { StaleNodeError } from "./errors"

describe("Arbor", () => {
  it("correctly updates the store when making sequential updates to a given node", () => {
    const user = {
      name: "Alice",
      age: 30,
    }

    const store = new Arbor(user)

    const alice = store.state
    alice.name = "Alice Doe"
    alice.age = 31

    expect(user).toEqual({
      name: "Alice",
      age: 30,
    })

    expect(alice).toEqual({
      name: "Alice",
      age: 30,
    })

    expect(store.state).toEqual({
      name: "Alice Doe",
      age: 31,
    })
  })

  it("supports subsequent mutations to the same path", () => {
    const user = {
      name: "Alice",
      age: 30,
    }

    const store = new Arbor(user)

    const alice = store.state
    alice.name = "Alice Doe"
    alice.age = 31

    expect(user).toEqual({
      name: "Alice",
      age: 30,
    })

    expect(alice).toEqual({
      name: "Alice",
      age: 30,
    })

    expect(store.state).toEqual({
      name: "Alice Doe",
      age: 31,
    })
  })

  it("supports subsequent mutations to the same path when on forgiven mode", () => {
    const user = {
      name: "Alice",
      age: 30,
    }

    const store = new Arbor(user, {
      mode: MutationMode.FORGIVEN,
    })

    const alice = store.state
    alice.name = "Alice Doe"
    alice.age = 31

    expect(user).toEqual({
      name: "Alice Doe",
      age: 31,
    })

    expect(alice).toEqual({
      name: "Alice Doe",
      age: 31,
    })

    expect(store.state).toEqual({
      name: "Alice Doe",
      age: 31,
    })
  })

  it("allows passing custom node handlers to the store via configuration", () => {
    interface Todo {
      text: string
    }

    class MyArrayHandler extends NodeArrayHandler {
      $ids = new Map<number, string>()

      $idFor(index: number) {
        return this.$ids.get(index)
      }

      get(target: object[], prop: string, receiver: INode<object[], object[]>) {
        const index = parseInt(prop, 10)

        if (!Number.isNaN(index) && !this.$ids.has(index)) {
          this.$ids.set(index, `random-id-${index}`)
        }

        return super.get(target, prop, receiver)
      }
    }

    const store = new Arbor<Todo[]>(
      [{ text: "Walk the dogs" }, { text: "Document Arbor" }],
      { handlers: [MyArrayHandler] }
    )

    // traverses the tree forcing Arbor to proxy and
    // cache store.state and store.state[1] nodes
    store.state[1].text
    const todos = store.state as any

    // Arbor lazily proxies nodes in the state tree, since store.state[0]
    // was never proxied no custom $id was generated for that node.
    expect(todos.$idFor(0)).toBeUndefined()
    expect(todos.$idFor(1)).toEqual("random-id-1")
  })

  describe("#root", () => {
    it("retrieves the root node", () => {
      const initialState = {
        users: [{ name: "User 1" }, { name: "User 2" }],
      }
      const store = new Arbor(initialState)

      const node = store.state as INode<{ users: { name: string }[] }>

      expect(node.$unwrap()).toBe(initialState)
    })
  })

  describe("#setState", () => {
    interface IUser {
      name: string
    }

    it("sets a value as the root of the store", () => {
      const initialState = {
        users: [{ name: "User 1" }, { name: "User 2" }],
      }

      const store = new Arbor<{ users: IUser[] }>()
      const node = store.setState(initialState)

      const nodeFromCache = store.state

      expect(nodeFromCache).toBe(node)
      expect(nodeFromCache.users[1].name).toEqual("User 2")
    })

    it("notifies subscribers about the new state", () => {
      const initialState = {
        users: [{ name: "User 1" }],
      }

      const newState = {
        users: [{ name: "User 1" }, { name: "User 2" }],
      }

      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()
      const store = new Arbor<{ users: IUser[] }>(initialState)
      store.subscribe(subscriber1)
      store.subscribe(subscriber2)

      const newRoot = store.setState(newState)

      expect(subscriber1).toHaveBeenCalledWith({
        mutationPath: Path.root,
        metadata: {
          operation: "set",
          props: [],
        },
        state: {
          current: newRoot,
          previous: initialState,
        },
      })

      expect(subscriber2).toHaveBeenCalledWith({
        mutationPath: Path.root,
        metadata: {
          operation: "set",
          props: [],
        },
        state: {
          current: newRoot,
          previous: initialState,
        },
      })
    })
  })

  describe("Path walking", () => {
    it("walks a proxied path", () => {
      const store = new Arbor({
        users: [{ name: "User 1" }, { name: "User 2" }],
      })

      expect(Path.root.walk(store.state)).toBe(store.state)
      expect(Path.parse("/users/1").walk(store.state)).toBe(store.state.users[1])
    })
  })

  describe("#mutate", () => {
    it("mutates a given path within the state tree", () => {
      const initialState = {
        users: [{ name: "Bob" }, { name: "Alice" }],
      }

      const store = new Arbor(initialState)
      const initialRoot = store.state
      const initialUsers = store.state.users
      const initialUser0 = store.state.users[0]
      const initialUser1 = store.state.users[1]

      store.mutate<{ name: string }>(Path.parse("/users/0"), (user) => {
        user.name = "Bob 2"
      })

      expect(store.state).not.toBe(initialRoot)
      expect(store.state.users).not.toBe(initialUsers)
      expect(store.state.users[0]).not.toBe(initialUser0)
      expect(store.state.users[1]).toBe(initialUser1)
      expect(store.state).toEqual({
        users: [{ name: "Bob 2" }, { name: "Alice" }],
      })
    })

    it("mutates a given node within the state tree", () => {
      const initialState = {
        users: [{ name: "Bob" }, { name: "Alice" }],
      }

      const store = new Arbor(initialState)
      const initialRoot = store.state
      const initialUsers = store.state.users
      const initialUser0 = store.state.users[0] as INode<{ name: string }>
      const initialUser1 = store.state.users[1]

      store.mutate(initialUser0, (user) => {
        user.name = "Bob 2"
      })

      expect(store.state).not.toBe(initialRoot)
      expect(store.state.users).not.toBe(initialUsers)
      expect(store.state.users[0]).not.toBe(initialUser0)
      expect(store.state.users[1]).toBe(initialUser1)
      expect(store.state).toEqual({
        users: [{ name: "Bob 2" }, { name: "Alice" }],
      })
    })

    it("notifies subscribers with mutation metadata", () => {
      const initialState = {
        users: [{ name: "User 1" }],
      }

      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()
      const store = new Arbor<{ users: { name: string }[] }>(initialState)
      store.subscribe(subscriber1)
      store.subscribe(subscriber2)

      store.state.users[0].name = "User"

      expect(subscriber1).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0"),
        metadata: {
          operation: "set",
          props: ["name"],
        },
        state: {
          current: store.state,
          previous: initialState,
        },
      })

      expect(subscriber2).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0"),
        metadata: {
          operation: "set",
          props: ["name"],
        },
        state: {
          current: store.state,
          previous: initialState,
        },
      })
    })
  })

  describe("State Change Subscriptions", () => {
    it("subscribes to any state changes", () => {
      const initialState = {
        users: [{ name: "User 1" }],
      }

      const store = new Arbor(initialState)

      return new Promise((resolve) => {
        store.subscribe(({ state }) => {
          expect(initialState).toBe(state.previous)
          expect(state.previous).toEqual({
            users: [{ name: "User 1" }],
          })

          expect(state.current).toEqual({
            users: [{ name: "User 1" }, { name: "User 2" }],
          })

          resolve(state.current)
        })

        store.state.users.push({ name: "User 2" })
      })
    })

    it("throws a stale node error when attempting to mutate a node that is no longer in the state tree", () => {
      const store = new Arbor(new Repository({ uuid: "1", name: "Alice" }, { uuid: "2", name: "Bob" }))

      const bob = store.state["2"]
      delete store.state["2"]

      expect(() => { bob.name = "This should not break the app" }).toThrowError(StaleNodeError)
      expect(store.state["2"]).toBeUndefined()
    })

    it("only notifies subscribers affected by the mutation path", () => {
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()
      const subscriber3 = jest.fn()
      const initialState = {
        users: [
          {
            name: "Alice",
            posts: [{ content: "Post 1" }, { content: "Post 2" }],
          },
          {
            name: "Bob",
            posts: [{ content: "Post 3" }, { content: "Post 4" }],
          },
        ],
      }

      const firstUpdateExpectedState = {
        users: [
          {
            name: "Alice",
            posts: [{ content: "Post 1" }, { content: "Post 2 updated" }],
          },
          {
            name: "Bob",
            posts: [{ content: "Post 3" }, { content: "Post 4" }],
          },
        ],
      }

      const store = new Arbor(initialState)

      store.subscribe(subscriber1)
      store.subscribeTo(store.state.users[1], subscriber2)
      store.subscribeTo(store.state.users[0].posts, subscriber3)

      store.state.users[0].posts[1].content = "Post 2 updated"

      expect(subscriber2).not.toHaveBeenCalled()
      expect(subscriber1).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0/posts/1"),
        metadata: {
          operation: "set",
          props: ["content"],
        },
        state: {
          previous: initialState,
          current: store.state,
        },
      })

      expect(subscriber3).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0/posts/1"),
        metadata: {
          operation: "set",
          props: ["content"],
        },
        state: {
          previous: initialState,
          current: store.state,
        },
      })

      store.state.users[0].posts[1].content = "Post 2 updated again"

      expect(subscriber2).not.toHaveBeenCalled()
      expect(subscriber1).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0/posts/1"),
        metadata: {
          operation: "set",
          props: ["content"],
        },
        state: {
          previous: firstUpdateExpectedState,
          current: store.state,
        },
      })

      expect(subscriber3).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0/posts/1"),
        metadata: {
          operation: "set",
          props: ["content"],
        },
        state: {
          previous: firstUpdateExpectedState,
          current: store.state,
        },
      })
    })
  })

  describe("Array use cases", () => {
    it("Keeps state tree paths in sync when reversing an array", () => {
      const store = new Arbor([
        { name: "User 1" },
        { name: "User 2" },
        { name: "User 3" },
      ])

      warmup(store.state[0])
      warmup(store.state[1])
      warmup(store.state[2])

      store.state.reverse()

      warmup(store.state[0])
      warmup(store.state[1])
      warmup(store.state[2])

      store.state[0].name = "User 3 Updated"

      const user1 = warmup(store.state[0])
      const user2 = warmup(store.state[1])
      const user3 = warmup(store.state[2])

      expect(user1.$path.toString()).toEqual("/0")
      expect(user2.$path.toString()).toEqual("/1")
      expect(user3.$path.toString()).toEqual("/2")

      expect(user1.name).toEqual("User 3 Updated")
      expect(user2.name).toEqual("User 2")
      expect(user3.name).toEqual("User 1")
      expect(store.state).toEqual([
        { name: "User 3 Updated" },
        { name: "User 2" },
        { name: "User 1" },
      ])
    })

    it("deleting items keep paths up-to-date", () => {
      const store = new Arbor([
        { name: "User 1" },
        { name: "User 2" },
        { name: "User 3" },
      ])

      warmup(store.state[0])
      warmup(store.state[1])
      warmup(store.state[2])

      delete store.state[0]

      const user1 = warmup(store.state[0])
      const user2 = warmup(store.state[1])

      expect(user1.$path.toString()).toEqual("/0")
      expect(user2.$path.toString()).toEqual("/1")

      expect(user1.name).toEqual("User 2")
      expect(user2.name).toEqual("User 3")
      expect(store.state).toEqual([{ name: "User 2" }, { name: "User 3" }])
    })
  })

  describe("custom data model", () => {
    class Todo extends BaseNode<Todo> {
      uuid!: string
      text!: string
      completed: boolean

      complete() {
        this.completed = true
      }

      activate() {
        this.completed = false
      }

      get status() {
        return this.completed ? "Completed" : "Active"
      }
    }

    it("supports user defined data models", () => {
      const store = new Arbor([
        Todo.from<Todo>({ text: "Do the dishes", completed: false }),
        Todo.from<Todo>({ text: "Clean the house", completed: true }),
      ])

      const todo1 = store.state[0]
      const todo2 = store.state[1]

      expect(todo1.status).toEqual("Active")
      expect(todo2.status).toEqual("Completed")

      todo1.text = "Walk the dog"

      expect(todo1).not.toBe(store.state[0])
      expect(todo2).toBe(store.state[1])
      expect(store.state).toEqual([
        Todo.from<Todo>({ text: "Walk the dog", completed: false }),
        Todo.from<Todo>({ text: "Clean the house", completed: true }),
      ])
    })

    it("can encasulate mutation logic", () => {
      const store = new Arbor([
        Todo.from<Todo>({ text: "Do the dishes", completed: false }),
        Todo.from<Todo>({ text: "Clean the house", completed: true }),
      ])

      let todo = store.state[0]
      store.state[0].complete()

      expect(store.state[0]).not.toBe(todo)
      expect(store.state[0].completed).toBe(true)

      todo = store.state[0]
      store.state[0].activate()

      expect(store.state[0]).not.toBe(todo)
      expect(store.state[0].completed).toBe(false)
    })

    it("can be refreshed", () => {
      const store = new Arbor([
        Todo.from<Todo>({ text: "Do the dishes", completed: false }),
        Todo.from<Todo>({ text: "Clean the house", completed: true }),
      ])

      const firstTodo = store.state[0]
      firstTodo.complete()
      firstTodo.text = "Updated content"

      expect(firstTodo.reload()).toEqual(
        Todo.from<Todo>({ text: "Updated content", completed: true })
      )
    })

    describe("#with", () => {
      it("allows for custom node proxy handlers", () => {
        class MyArrayHandler extends NodeArrayHandler {
          $ids = new Map<number, string>()

          $idFor(index: number) {
            return this.$ids.get(index)
          }

          get(
            target: object[],
            prop: string,
            receiver: INode<object[], object[]>
          ) {
            const index = parseInt(prop, 10)

            if (!Number.isNaN(index) && !this.$ids.has(index)) {
              this.$ids.set(index, `random-id-${index}`)
            }

            return super.get(target, prop, receiver)
          }
        }

        const store = new Arbor<Todo[]>([])

        // Overrides the default behavior for proxying array values
        store.with(MyArrayHandler)

        // Initializes the store after registering a new node handler
        // so that the root node can be proxyied with the correct handler
        store.setState([
          Todo.from<Todo>({ text: "Walk the dogs" }),
          Todo.from<Todo>({ text: "Document Arbor" }),
        ])

        // traverses the tree forcing Arbor to proxy and
        // cache store.state and store.state[1] nodes
        store.state[1].text
        const todos = store.state as any

        // Arbor lazily proxies nodes in the state tree, since store.state[0]
        // was never proxied no custom $id was generated for that node.
        expect(todos.$idFor(0)).toBeUndefined()
        expect(todos.$idFor(1)).toEqual("random-id-1")
      })
    })

    it("ignores mutations on stale nodes", () => {
      const store = new Arbor({
        users: {
          a: { name: "Alice" },
          b: { name: "Bob" },
          c: { name: "Carol" },
        }
      })

      const alice = store.state.users.a
      store.state.users.a = store.state.users.b

      expect(store.state.users.a).toEqual({ name: "Bob" })
      expect(() => { alice.name = "Alice Doe" }).toThrowError(StaleNodeError)
      expect(store.state.users.a).toEqual({ name: "Bob" })
    })

    it("ignores array deletions on stale nodes", () => {
      const store = new Arbor({
        users: [
          { name: "Alice" },
          { name: "Bob" },
          { name: "Carol" },
        ]
      })

      const alice = store.state.users[0]
      store.state.users[0] = store.state.users[1]

      expect(store.state.users[0]).toEqual({ name: "Bob" })
      expect(() => { alice.name = "Alice Doe" }).toThrowError(StaleNodeError)
      expect(store.state.users[0]).toEqual({ name: "Bob" })
    })

    describe("Repository", () => {
      it("allows managing Repository of items", () => {
        const store = new Arbor(
          new Repository(
            Todo.from<Todo>({
              uuid: "abc",
              text: "Do the dishes",
              completed: false,
            }),
            Todo.from<Todo>({
              uuid: "bcd",
              text: "Clean the house",
              completed: true,
            })
          )
        )

        const [firstItem, secondItem] = store.state

        delete store.state.abc

        const secondItem2 = store.state.bcd

        expect(secondItem).toBe(secondItem2)
        expect(store.state.abc).toBeUndefined()
        expect(store.state.bcd).toBe(secondItem)
        expect(firstItem.isStale()).toBe(true)
      })
    })
  })
})
