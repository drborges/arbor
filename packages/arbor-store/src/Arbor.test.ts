/* eslint-disable max-classes-per-file */
import Path from "./Path"
import Arbor from "./Arbor"
import BaseNode from "./BaseNode"
import Repository from "./Repository"
import { ArborProxiable } from "./isProxiable"

describe("Arbor", () => {
  describe("Example: State Tree and Structural Sharing", () => {
    it("generates a new state tree by reusing nodes unaffected by the mutation (structural sharing)", () => {
      const store = new Arbor({
        todos: [
          { text: "Clean the house" },
          { text: "Walk the dogs" },
        ],
        users: [
          { name: "Alice" },
          { name: "Bob" },
        ]
      })

      const root = store.state
      const todos = store.state.todos
      const todo0 = store.state.todos[0]
      const todo1 = store.state.todos[1]
      const users = store.state.users
      const user0 = store.state.users[0]
      const user1 = store.state.users[1]

      todo0.text = "Clean the living room"

      expect(store.state).not.toBe(root)
      expect(store.state.todos).not.toBe(todos)
      expect(store.state.todos[0]).not.toBe(todo0)
      expect(store.state.todos[1]).toBe(todo1)
      expect(store.state.users).toBe(users)
      expect(store.state.users[0]).toBe(user0)
      expect(store.state.users[1]).toBe(user1)
    })

    it("ensures stale node references are also updated", () => {
      const store = new Arbor({
        count: 0
      })

      const counter = store.state
      const subscriber = jest.fn()
      store.subscribe(subscriber)

      counter.count++

      expect(counter.count).toBe(1)
      expect(store.state.count).toBe(1)
      expect(subscriber.mock.calls[0][0].state.previous.count).toBe(0)
      expect(subscriber.mock.calls[0][0].state.current.count).toBe(1)

      counter.count++

      expect(counter.count).toBe(2)
      expect(store.state.count).toBe(2)
      expect(subscriber.mock.calls[1][0].state.previous.count).toBe(1)
      expect(subscriber.mock.calls[1][0].state.current.count).toBe(2)
    })

    it("allows refreshing state tree nodes", () => {
      const store = new Arbor({
        count: 0
      })

      const counter = store.state
      // this mutation causes "counter" to become "stale"
      // it's a reference to a node belonging to the previous
      // state tree, e.g., it's count value will no longer be
      // in sync with the count value in the current and future
      // versions of the state tree.
      counter.count++
      // Updates the state tree generating a new one
      store.state.count++

      const refreshedCounter = store.getRefreshed(counter)

      // counter is not affected by the last mutation since it's
      // a stale node.
      expect(counter.count).toBe(1)
      // refreshing the node we get the new node at that same state
      // tree path holding the current counter state
      expect(refreshedCounter.count).toBe(2)
      // Accessing state tree nodes from the store always yields the
      // current node state
      expect(store.state.count).toBe(2)
    })
  })

  describe("Example: Deleting nodes from the state tree", () => {
    it("allows deleting nodes using the 'delete' keyword", () => {
      type Todo = {
        text: string
      }

      type Todos = {
        [key: string]: Todo
      }

      const store = new Arbor<Todos>({
        "1": { text: "Clean the house" },
        "2": { text: "Walk the dogs" },
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      delete store.state["2"]

      expect(store.state["2"]).toBeUndefined()
      expect(subscriber.mock.calls.length).toBe(1)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("delete")
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["2"])
      expect(subscriber.mock.calls[0][0].state.current).toEqual({
        "1": { text: "Clean the house" }
      })

      expect(subscriber.mock.calls[0][0].state.previous).toEqual({
        "1": { text: "Clean the house" },
        "2": { text: "Walk the dogs" },
      })
    })

    it("allows deleting nodes by detaching them from the state tree when extending from BaseNode class", () => {
      class Todo extends BaseNode<Todo> {
        text: string
      }

      type Todos = {
        [key: string]: Todo
      }

      const store = new Arbor<Todos>({
        "1": Todo.from<Todo>({ text: "Clean the house" }),
        "2": Todo.from<Todo>({ text: "Walk the dogs" }),
      })

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state["2"].detach()

      expect(store.state["2"]).toBeUndefined()
      expect(subscriber.mock.calls.length).toBe(1)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("delete")
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["2"])
      expect(subscriber.mock.calls[0][0].state.current).toEqual({
        "1": { text: "Clean the house" }
      })

      expect(subscriber.mock.calls[0][0].state.previous).toEqual({
        "1": { text: "Clean the house" },
        "2": { text: "Walk the dogs" },
      })
    })
  })

  describe("Example: Counter", () => {
    it("keeps track of a counter's state", () => {
      const store = new Arbor({
        count: 0
      })

      store.state.count++

      expect(store.state.count).toBe(1)
    })

    it("allows subsequent mutations to the same state tree node reference", () => {
      const store = new Arbor({
        count: 0
      })

      const counter = store.state
      counter.count++
      counter.count++

      expect(store.state.count).toBe(2)
    })

    it("subscribes to store mutations", () => {
      const store = new Arbor({
        count: 0
      })

      return new Promise((resolve) => {
        store.subscribe(event => {
          expect(event.mutationPath.toString()).toEqual("/")
          expect(event.metadata.props).toEqual(["count"])
          expect(event.metadata.operation).toEqual("set")
          expect(event.state.previous).toEqual({ count: 0 })
          expect(event.state.current).toEqual({ count: -1 })
          resolve(null)
        })

        store.state.count--
      })
    })
  })

  describe("Example: Todo List", () => {
    it("keeps track of a todo list state", () => {
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      store.state.push({ text: "Walk the dogs", status: "done" })

      expect(store.state).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
        { text: "Walk the dogs", status: "done" },
      ])
    })

    it("allows subsequent mutations to the same state tree node reference", () => {
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const todo = store.state[0]
      todo.status = "doing"
      todo.text = "Doing the dishes"

      expect(store.state).toEqual([
        { text: "Doing the dishes", status: "doing" },
        { text: "Clean the house", status: "doing" },
      ])
    })

    it("subscribes to store mutations", () => {
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const todo = store.state[0]

      return new Promise((resolve) => {
        store.subscribe(event => {
          expect(event.mutationPath.toString()).toEqual("/0")
          expect(event.metadata.props).toEqual(["status"])
          expect(event.metadata.operation).toEqual("set")
          expect(event.state.previous).toEqual([
            { text: "Do the dishes", status: "todo" },
            { text: "Clean the house", status: "doing" },
          ])

          expect(event.state.current).toEqual([
            { text: "Do the dishes", status: "doing" },
            { text: "Clean the house", status: "doing" },
          ])

          resolve(null)
        })

        todo.status = "doing"
      })
    })

    it("subscribes to any store mutations", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const todo1 = store.state[0]
      const todo2 = store.state[1]

      store.subscribe(subscriber)

      todo1.status = "doing"
      todo2.status = "done"

      expect(subscriber.mock.calls.length).toBe(2)
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.parse("/0"))
      expect(subscriber.mock.calls[1][0].mutationPath).toEqual(Path.parse("/1"))
    })

    it("subscribes to mutations on a specific state tree node", () => {
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const todo1 = store.state[0]
      const todo2 = store.state[1]

      store.subscribeTo(todo1, subscriber1)
      store.subscribeTo(todo2, subscriber2)

      todo1.status = "doing"
      todo2.status = "done"

      expect(subscriber1.mock.calls.length).toBe(1)
      expect(subscriber1.mock.calls[0][0].mutationPath).toEqual(Path.parse("/0"))
      expect(subscriber2.mock.calls.length).toBe(1)
      expect(subscriber2.mock.calls[0][0].mutationPath).toEqual(Path.parse("/1"))
    })

    it("mutations cause a new state tree to be generated via structural sharing", () => {
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Clean the house", status: "doing" },
      ])

      const root = store.state
      const todo1 = store.state[0]
      const todo2 = store.state[1]

      todo1.status = "doing"

      expect(root).not.toBe(store.state)
      expect(todo1).not.toBe(store.state[0])
      expect(todo2).toBe(store.state[1])
    })
  })

  describe("Example: Business logic encapsulation", () => {
    it("supports encapsulating logic within method definitions", () => {
      const store = new Arbor([
        {
          text: "Do the dishes",
          status: "todo",
          complete() {
            this.status = "done"
          }
        }
      ])

      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state[0].complete()

      expect(subscriber).toHaveBeenCalled()
      expect(store.state[0].status).toBe("done")
      expect(store.state[0].complete).toBeDefined()
    })

    it("allows for custom types as long as they are 'ArborProxiable'", () => {
      class Todo {
        [ArborProxiable] = true
        constructor(public text: string, public status = "todo") {}
        complete() {
          this.status = "done"
        }
      }

      const todo = new Todo("Do the dishes")
      const store = new Arbor([todo])
      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state[0].complete()

      expect(subscriber).toHaveBeenCalled()
      expect(store.state[0].status).toBe("done")
      expect(store.state[0].complete).toBeDefined()
    })

    it("allows for custom node types that inherit from BaseNode", () => {
      class Todo extends BaseNode<Todo> {
        text: string
        status = "todo"

        complete() {
          this.status = "done"
        }
      }

      const todo = Todo.from<Todo>({ text: "Do the dishes" })
      const store = new Arbor([todo])
      const subscriber = jest.fn()
      store.subscribe(subscriber)

      store.state[0].complete()

      expect(subscriber).toHaveBeenCalled()
      expect(store.state[0].status).toBe("done")
      expect(store.state[0]).toBeInstanceOf(Todo)
    })
  })

  describe("Example: Reactive Array API", () => {
    it("makes Array#push reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
      ])

      store.subscribe(subscriber)
      store.state.push({ text: "Walk the dogs", status: "todo" })

      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["1"])
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.root)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("push")
      expect(subscriber.mock.calls[0][0].state.current).toEqual(store.state)
      expect(subscriber.mock.calls[0][0].state.previous).toEqual([
        { text: "Do the dishes", status: "todo" },
      ])

      expect(store.state).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })

    it("makes Array#splice reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])

      store.subscribe(subscriber)
      store.state.splice(0, 2)

      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["0", "1"])
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.root)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("splice")
      expect(subscriber.mock.calls[0][0].state.current).toEqual(store.state)
      expect(subscriber.mock.calls[0][0].state.previous).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])

      expect(store.state).toEqual([
        { text: "Clean the house", status: "todo" }
      ])
    })

    it("makes 'delete' reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])

      store.subscribe(subscriber)
      delete store.state[0]

      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["0"])
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.root)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("delete")
      expect(subscriber.mock.calls[0][0].state.current).toEqual(store.state)
      expect(subscriber.mock.calls[0][0].state.previous).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])

      expect(store.state).toEqual([
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])
    })

    it("makes Array#shift reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])

      store.subscribe(subscriber)
      const shiftedTodo = store.state.shift()

      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["0"])
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.root)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("shift")
      expect(subscriber.mock.calls[0][0].state.current).toEqual(store.state)
      expect(subscriber.mock.calls[0][0].state.previous).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])

      expect(shiftedTodo).toEqual({ text: "Do the dishes", status: "todo" })
      expect(store.state).toEqual([
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])
    })

    it("makes Array#pop reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])

      store.subscribe(subscriber)
      const poppedTodo = store.state.pop()

      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual(["2"])
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.root)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("pop")
      expect(subscriber.mock.calls[0][0].state.current).toEqual(store.state)
      expect(subscriber.mock.calls[0][0].state.previous).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" }
      ])

      expect(poppedTodo).toEqual({ text: "Clean the house", status: "todo" })
      expect(store.state).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })

    it("makes Array#unshift reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])

      store.subscribe(subscriber)
      const length = store.state.unshift({ text: "Clean the house", status: "todo" })

      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual([])
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.root)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("unshift")
      expect(subscriber.mock.calls[0][0].state.current).toEqual(store.state)
      expect(subscriber.mock.calls[0][0].state.previous).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])

      expect(length).toEqual(3)
      expect(store.state).toEqual([
        { text: "Clean the house", status: "todo" },
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })

    it("makes Array#reverse reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])

      store.subscribe(subscriber)
      const reversed = store.state.reverse()

      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual([])
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.root)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("reverse")
      expect(subscriber.mock.calls[0][0].state.current).toEqual(store.state)
      expect(subscriber.mock.calls[0][0].state.previous).toEqual([
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])

      expect(reversed).toBe(store.state)
      expect(store.state).toEqual([
        { text: "Walk the dogs", status: "todo" },
        { text: "Do the dishes", status: "todo" },
      ])
    })

    it("makes Array#sort reactive", () => {
      const subscriber = jest.fn()
      const store = new Arbor([
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
        { text: "Do the dishes", status: "todo" },
      ])

      store.subscribe(subscriber)
      const sorted = store.state.sort((a, b) => a.text.localeCompare(b.text))

      expect(subscriber.mock.calls.length).toEqual(1)
      expect(subscriber.mock.calls[0][0].metadata.props).toEqual([])
      expect(subscriber.mock.calls[0][0].mutationPath).toEqual(Path.root)
      expect(subscriber.mock.calls[0][0].metadata.operation).toEqual("sort")
      expect(subscriber.mock.calls[0][0].state.current).toEqual(store.state)
      expect(subscriber.mock.calls[0][0].state.previous).toEqual([
        { text: "Walk the dogs", status: "todo" },
        { text: "Clean the house", status: "todo" },
        { text: "Do the dishes", status: "todo" },
      ])

      expect(sorted).toBe(store.state)
      expect(store.state).toEqual([
        { text: "Clean the house", status: "todo" },
        { text: "Do the dishes", status: "todo" },
        { text: "Walk the dogs", status: "todo" },
      ])
    })
  })

  describe("Example: Repository of nodes", () => {
    it("provides an iteratable key value store to make it easier to track nodes", () => {
      class Todo extends BaseNode<Todo> {
        uuid: string
        text: string
      }

      const store = new Arbor(new Repository(
        Todo.from<Todo>({ uuid: "1", text: "Clean the house" }),
        Todo.from<Todo>({ uuid: "2", text: "Walk the dogs" }),
      ))

      const todo1 = store.state["1"]
      // A Repository even though is a key-value store, it is also
      // iterable just like arrays, thus destructuring repositories
      // will yield an array
      const todos = [...store.state]

      expect(todos[0]).toBe(store.state["1"])
      expect(todos[1]).toBe(store.state["2"])

      todos[0].text = "Clean the living room"

      expect(todo1.text).toEqual("Clean the living room")
      expect(store.state).toBeInstanceOf(Repository)
      expect(store.state["1"]).toEqual({
        uuid: "1",
        text: "Clean the living room"
      })
    })
  })
})
