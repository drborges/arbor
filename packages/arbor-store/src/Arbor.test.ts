/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import Path from "./Path"
import Arbor, { MutationMode, INode } from "./Arbor"
import BaseNode from "./BaseNode"
import Repository from "./Repository"
import { warmup } from "./test.helpers"
import NodeArrayHandler from "./NodeArrayHandler"

describe("Arbor", () => {
  it("correctly updates the store when making sequential updates to a given node", () => {
    const user = {
      name: "Alice",
      age: 30,
    }

    const store = new Arbor(user)

    const alice = store.root
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

    expect(store.root).toEqual({
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

    const alice = store.root
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

    expect(store.root).toEqual({
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

    const alice = store.root
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

    expect(store.root).toEqual({
      name: "Alice Doe",
      age: 31,
    })
  })

  it("allows passing custom node handler factories to the store via configuration", () => {
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
      { factories: [MyArrayHandler] }
    )

    // traverses the tree forcing Arbor to proxy and
    // cache store.root and store.root[1] nodes
    store.root[1].text
    const todos = store.root as any

    // Arbor lazily proxies nodes in the state tree, since store.root[0]
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

      const node = store.root as INode<{ users: { name: string }[] }>

      expect(node.$unwrap()).toBe(initialState)
    })
  })

  describe("#setRoot", () => {
    interface IUser {
      name: string
    }

    it("sets a value as the root of the store", () => {
      const initialState = {
        users: [{ name: "User 1" }, { name: "User 2" }],
      }

      const store = new Arbor<{ users: IUser[] }>()
      const node = store.setRoot(initialState)

      const nodeFromCache = store.root

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

      const newRoot = store.setRoot(newState)

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

      expect(Path.root.walk(store.root)).toBe(store.root)
      expect(Path.parse("/users/1").walk(store.root)).toBe(store.root.users[1])
    })
  })

  describe("#mutate", () => {
    it("mutates a given path within the state tree", () => {
      const initialState = {
        users: [{ name: "Bob" }, { name: "Alice" }],
      }

      const store = new Arbor(initialState)
      const initialRoot = store.root
      const initialUsers = store.root.users
      const initialUser0 = store.root.users[0]
      const initialUser1 = store.root.users[1]

      store.mutate<{ name: string }>(Path.parse("/users/0"), (user) => {
        user.name = "Bob 2"
      })

      expect(store.root).not.toBe(initialRoot)
      expect(store.root.users).not.toBe(initialUsers)
      expect(store.root.users[0]).not.toBe(initialUser0)
      expect(store.root.users[1]).toBe(initialUser1)
      expect(store.root).toEqual({
        users: [{ name: "Bob 2" }, { name: "Alice" }],
      })
    })

    it("mutates a given node within the state tree", () => {
      const initialState = {
        users: [{ name: "Bob" }, { name: "Alice" }],
      }

      const store = new Arbor(initialState)
      const initialRoot = store.root
      const initialUsers = store.root.users
      const initialUser0 = store.root.users[0] as INode<{ name: string }>
      const initialUser1 = store.root.users[1]

      store.mutate(initialUser0, (user) => {
        user.name = "Bob 2"
      })

      expect(store.root).not.toBe(initialRoot)
      expect(store.root.users).not.toBe(initialUsers)
      expect(store.root.users[0]).not.toBe(initialUser0)
      expect(store.root.users[1]).toBe(initialUser1)
      expect(store.root).toEqual({
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

      store.root.users[0].name = "User"

      expect(subscriber1).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0"),
        metadata: {
          operation: "set",
          props: ["name"],
        },
        state: {
          current: store.root,
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
          current: store.root,
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

        store.root.users.push({ name: "User 2" })
      })
    })

    it("handles mutations to nodes no longer attached to the state tree", () => {
      const store = new Arbor(new Repository({ uuid: "1", name: "Alice" }, { uuid: "2", name: "Bob" }))

      const bob = store.root["2"]
      delete store.root["2"]
      bob.name = "This should not break the app"

      expect(store.root["2"]).toBeUndefined()
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
      store.subscribeTo(store.root.users[1], subscriber2)
      store.subscribeTo(store.root.users[0].posts, subscriber3)

      store.root.users[0].posts[1].content = "Post 2 updated"

      expect(subscriber2).not.toHaveBeenCalled()
      expect(subscriber1).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0/posts/1"),
        metadata: {
          operation: "set",
          props: ["content"],
        },
        state: {
          previous: initialState,
          current: store.root,
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
          current: store.root,
        },
      })

      store.root.users[0].posts[1].content = "Post 2 updated again"

      expect(subscriber2).not.toHaveBeenCalled()
      expect(subscriber1).toHaveBeenCalledWith({
        mutationPath: Path.parse("/users/0/posts/1"),
        metadata: {
          operation: "set",
          props: ["content"],
        },
        state: {
          previous: firstUpdateExpectedState,
          current: store.root,
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
          current: store.root,
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

      warmup(store.root[0])
      warmup(store.root[1])
      warmup(store.root[2])

      store.root.reverse()

      warmup(store.root[0])
      warmup(store.root[1])
      warmup(store.root[2])

      store.root[0].name = "User 3 Updated"

      const user1 = warmup(store.root[0])
      const user2 = warmup(store.root[1])
      const user3 = warmup(store.root[2])

      expect(user1.$path.toString()).toEqual("/0")
      expect(user2.$path.toString()).toEqual("/1")
      expect(user3.$path.toString()).toEqual("/2")

      expect(user1.name).toEqual("User 3 Updated")
      expect(user2.name).toEqual("User 2")
      expect(user3.name).toEqual("User 1")
      expect(store.root).toEqual([
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

      warmup(store.root[0])
      warmup(store.root[1])
      warmup(store.root[2])

      delete store.root[0]

      const user1 = warmup(store.root[0])
      const user2 = warmup(store.root[1])

      expect(user1.$path.toString()).toEqual("/0")
      expect(user2.$path.toString()).toEqual("/1")

      expect(user1.name).toEqual("User 2")
      expect(user2.name).toEqual("User 3")
      expect(store.root).toEqual([{ name: "User 2" }, { name: "User 3" }])
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

      const todo1 = store.root[0]
      const todo2 = store.root[1]

      expect(todo1.status).toEqual("Active")
      expect(todo2.status).toEqual("Completed")

      todo1.text = "Walk the dog"

      expect(todo1).not.toBe(store.root[0])
      expect(todo2).toBe(store.root[1])
      expect(store.root).toEqual([
        Todo.from<Todo>({ text: "Walk the dog", completed: false }),
        Todo.from<Todo>({ text: "Clean the house", completed: true }),
      ])
    })

    it("can encasulate mutation logic", () => {
      const store = new Arbor([
        Todo.from<Todo>({ text: "Do the dishes", completed: false }),
        Todo.from<Todo>({ text: "Clean the house", completed: true }),
      ])

      let todo = store.root[0]
      store.root[0].complete()

      expect(store.root[0]).not.toBe(todo)
      expect(store.root[0].completed).toBe(true)

      todo = store.root[0]
      store.root[0].activate()

      expect(store.root[0]).not.toBe(todo)
      expect(store.root[0].completed).toBe(false)
    })

    it("can be refreshed", () => {
      const store = new Arbor([
        Todo.from<Todo>({ text: "Do the dishes", completed: false }),
        Todo.from<Todo>({ text: "Clean the house", completed: true }),
      ])

      const firstTodo = store.root[0]
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
        store.setRoot([
          Todo.from<Todo>({ text: "Walk the dogs" }),
          Todo.from<Todo>({ text: "Document Arbor" }),
        ])

        // traverses the tree forcing Arbor to proxy and
        // cache store.root and store.root[1] nodes
        store.root[1].text
        const todos = store.root as any

        // Arbor lazily proxies nodes in the state tree, since store.root[0]
        // was never proxied no custom $id was generated for that node.
        expect(todos.$idFor(0)).toBeUndefined()
        expect(todos.$idFor(1)).toEqual("random-id-1")
      })
    })

    describe("Collection", () => {
      it("allows managing collections of items", () => {
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

        const firstItem = store.root.abc as INode<Todo>
        const lastItem = store.root.bcd as INode<Todo>

        delete store.root.abc

        const lastItem2 = store.root.bcd as INode<Todo>

        expect(lastItem).toBe(lastItem2)

        // does not trigger any mutations since the node is no longer in the state tree
        firstItem.completed = true

        expect(store.root[firstItem.uuid]).toBeUndefined()
        expect(store.root.bcd).toBe(lastItem)
      })
    })
  })
})
