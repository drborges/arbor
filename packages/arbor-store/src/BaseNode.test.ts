import Arbor from "./Arbor"
import BaseNode from "./BaseNode"
import Repository from "./Repository"
import { ArborError, NotAnArborNodeError } from "./errors"

describe("BaseNode", () => {
  class Todo extends BaseNode<Todo> {
    uuid!: string
    text!: string
    completed: boolean
  }

  describe("#detach", () => {
    it("allows detaching a node from the state tree", () => {
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

      const todo1 = store.state.abc

      todo1.detach()

      expect(store.state.abc).toBeUndefined()
      expect(todo1.isDetached()).toBe(true)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.detach()).toThrowError(NotAnArborNodeError)
    })

    it("throws an error when trying to detach root node", () => {
      const todo = Todo.from<Todo>({
        uuid: "abc",
        text: "Do the dishes",
        completed: false,
      })

      const store = new Arbor(todo)

      expect(() => store.state.detach()).toThrowError(ArborError)
    })

    it("publishes mutation metadata to subscribers", () => {
      const todo = Todo.from<Todo>({
        uuid: "abc",
        text: "Do the dishes",
        completed: false,
      })

      const store = new Arbor({ todo })

      store.subscribe((event) => {
        expect(event.metadata.operation).toBe("delete")
        expect(event.metadata.props).toEqual(["todo"])
      })

      store.state.todo.detach()
    })
  })

  describe("#parent", () => {
    it("allows accessing a parent node in the state tree", () => {
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

      const todo = store.state.abc

      const todos = todo.parent()

      expect(todos).toBe(store.state)
    })

    it("returns undefined if parent node does not exist", () => {
      const store = new Arbor(
        Todo.from<Todo>({
          uuid: "abc",
          text: "Do the dishes",
          completed: false,
        })
      )

      const parent = store.state.parent()

      expect(parent).toBe(undefined)
    })
  })

  describe("#merge", () => {
    it("allows merging attributes to the node", () => {
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

      const root = store.state
      const todo1 = store.state.abc
      const todo2 = store.state.bcd

      todo1.merge({ text: "Walk the dogs" })

      expect(store.state).not.toBe(root)
      expect(store.state.bcd).toBe(todo2)
      expect(store.state.abc).not.toBe(todo1)
      expect(store.state.abc).toEqual(
        Todo.from<Todo>({
          uuid: "abc",
          text: "Walk the dogs",
          completed: false,
        })
      )
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.merge({})).toThrowError(NotAnArborNodeError)
    })

    it("publishes mutation metadata to subscribers", () => {
      const todo = Todo.from<Todo>({
        uuid: "abc",
        text: "Do the dishes",
        completed: false,
      })

      const store = new Arbor({
        todoId: todo,
      })

      store.subscribe((event) => {
        expect(event.metadata.operation).toBe("merge")
        expect(event.metadata.props).toEqual(["text", "completed"])
      })

      store.state.todoId.merge({
        text: "New Todo",
        completed: true,
      })
    })
  })

  describe("#isDetached", () => {
    it("checks whether or not a node is no longer valid", () => {
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

      const todo = store.state.abc

      expect(todo.isDetached()).toBe(false)
      delete store.state.abc
      expect(todo.isDetached()).toBe(true)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.isDetached()).toThrowError(NotAnArborNodeError)
    })
  })

  describe("#path", () => {
    it("retrieves the node path within the state tree", () => {
      const store = new Arbor({
        todos: new Repository(
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
        ),
      })

      const todo = store.state.todos.abc

      expect(todo.path.toString()).toBe("/todos/abc")
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.path).toThrowError(NotAnArborNodeError)
    })
  })
})
