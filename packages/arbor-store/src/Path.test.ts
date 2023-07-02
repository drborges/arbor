import { Arbor } from "./Arbor"
import { Path } from "./Path"
import { InvalidArgumentError } from "./errors"
import { unwrap } from "./utilities"

describe("Path", () => {
  const state = {
    todos: [{ text: "Clean the house" }],
  }

  describe("#child", () => {
    it("creates a child path", () => {
      const parent = Path.root.child(state).child(state.todos)
      const child = parent.child(state.todos[0])

      expect(child.segments[0]).toBe(state)
      expect(child.segments[1]).toBe(state.todos)
      expect(child.segments[2]).toBe(state.todos[0])
    })
  })

  describe("#isRoot", () => {
    it("checks if a path points to the root of a state tree", () => {
      expect(
        Path.root.child(state).child(state.todos).child(state.todos[0]).isRoot()
      ).toBe(false)
      expect(Path.root.child(state).child(state.todos).isRoot()).toBe(false)
      expect(Path.root.child(state).isRoot()).toBe(false)
      expect(Path.root.isRoot()).toBe(true)
    })
  })

  describe("#parent", () => {
    it("returns the parent path", () => {
      const parent = Path.root.child(state).child(state.todos)
      const child = parent.child(state.todos[0])

      expect(child.parent).toEqual(parent)
    })

    it("returns the parent path of a root path", () => {
      const path = Path.root

      expect(path.parent).toEqual(null)
    })
  })

  describe("#walk", () => {
    it("traverses a given state tree node until it reaches the value referenced by the path", () => {
      const path1 = Path.root
      const path2 = Path.root.child(state.todos)
      const path3 = Path.root.child(state.todos).child(state.todos[0])

      const store = new Arbor(state)
      // Since Arbor generates the state tree in a lazy manner
      // we need to ensure the tree is generated in order to
      // test for the scenarios below.
      store.state.todos[0]

      expect(unwrap(path1.walk(store.state))).toBe(state)
      expect(unwrap(path2.walk(store.state))).toBe(state.todos)
      expect(unwrap(path3.walk(store.state))).toBe(state.todos[0])
    })

    it("returns undefined if path does not reference any nodes within the state tree", () => {
      const path = Path.root.child(state)

      const store = new Arbor(state)
      store.state.todos[0]

      expect(path.walk(store.state)).toBe(undefined)
    })
  })

  describe("#matches", () => {
    it("checks if a path matches another given path", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Do the dishes" }],
      }

      const rootPath = Path.root
      const todosPath = rootPath.child(state.todos)
      const todo0Path = todosPath.child(state.todos[0])
      const todo1Path = todosPath.child(state.todos[1])

      expect(rootPath.matches(Path.root)).toBe(true)
      expect(todosPath.matches(Path.root)).toBe(false)
      expect(todo0Path.matches(Path.root)).toBe(false)
      expect(todo1Path.matches(Path.root)).toBe(false)
      expect(rootPath.matches(todosPath)).toBe(false)
      expect(rootPath.matches(todo0Path)).toBe(false)
      expect(rootPath.matches(todo1Path)).toBe(false)

      expect(todosPath.matches(todo0Path)).toBe(false)
      expect(todosPath.matches(todo1Path)).toBe(false)

      expect(todo0Path.matches(todo1Path)).toBe(false)

      expect(todosPath.matches(Path.root.child(state.todos))).toBe(true)
      expect(
        todo0Path.matches(Path.root.child(state.todos).child(state.todos[0]))
      ).toBe(true)
      expect(
        todo1Path.matches(Path.root.child(state.todos).child(state.todos[1]))
      ).toBe(true)
    })

    it("checks if a path matches a given ArborNode", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Do the dishes" }],
      }

      const store = new Arbor(state)

      const rootPath = Path.root
      const todosPath = rootPath.child(state.todos)
      const todo0Path = todosPath.child(state.todos[0])
      const todo1Path = todosPath.child(state.todos[1])

      expect(rootPath.matches(store.state)).toBe(true)
      expect(rootPath.matches(store.state.todos)).toBe(false)
      expect(rootPath.matches(store.state.todos[0])).toBe(false)
      expect(rootPath.matches(store.state.todos[1])).toBe(false)

      expect(todosPath.matches(store.state)).toBe(false)
      expect(todosPath.matches(store.state.todos)).toBe(true)
      expect(todosPath.matches(store.state.todos[0])).toBe(false)
      expect(todosPath.matches(store.state.todos[1])).toBe(false)

      expect(todo0Path.matches(store.state)).toBe(false)
      expect(todo0Path.matches(store.state.todos)).toBe(false)
      expect(todo0Path.matches(store.state.todos[0])).toBe(true)
      expect(todo0Path.matches(store.state.todos[1])).toBe(false)

      expect(todo1Path.matches(store.state)).toBe(false)
      expect(todo1Path.matches(store.state.todos)).toBe(false)
      expect(todo1Path.matches(store.state.todos[0])).toBe(false)
      expect(todo1Path.matches(store.state.todos[1])).toBe(true)
    })

    it("throws an error if the argument passed in is not a Path nor an ArborNode", () => {
      expect(() =>
        Path.root.matches("Not a path nor node" as unknown as Path)
      ).toThrow(InvalidArgumentError)
    })
  })

  describe("#affects", () => {
    it("checks if a path affects another given path", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Do the dishes" }],
      }

      const rootPath = Path.root
      const todosPath = rootPath.child(state.todos)
      const todo0Path = todosPath.child(state.todos[0])
      const todo1Path = todosPath.child(state.todos[1])

      expect(rootPath.affects(Path.root)).toBe(true)
      expect(rootPath.affects(todosPath)).toBe(false)
      expect(rootPath.affects(todo0Path)).toBe(false)
      expect(rootPath.affects(todo1Path)).toBe(false)

      expect(todosPath.affects(Path.root)).toBe(true)
      expect(todo0Path.affects(Path.root)).toBe(true)
      expect(todo1Path.affects(Path.root)).toBe(true)

      expect(todosPath.affects(todo0Path)).toBe(false)
      expect(todosPath.affects(todo1Path)).toBe(false)

      expect(todo0Path.affects(todo1Path)).toBe(false)

      expect(todosPath.affects(Path.root.child(state.todos))).toBe(true)
      expect(
        todo0Path.affects(Path.root.child(state.todos).child(state.todos[0]))
      ).toBe(true)
      expect(
        todo1Path.affects(Path.root.child(state.todos).child(state.todos[1]))
      ).toBe(true)
    })

    it("checks if a path affects a given ArborNode", () => {
      const state = {
        todos: [{ text: "Clean the house" }, { text: "Do the dishes" }],
      }

      const store = new Arbor(state)

      const rootPath = Path.root
      const todosPath = rootPath.child(state.todos)
      const todo0Path = todosPath.child(state.todos[0])
      const todo1Path = todosPath.child(state.todos[1])

      expect(rootPath.affects(store.state)).toBe(true)
      expect(rootPath.affects(store.state.todos)).toBe(false)
      expect(rootPath.affects(store.state.todos[0])).toBe(false)
      expect(rootPath.affects(store.state.todos[1])).toBe(false)

      expect(todosPath.affects(store.state)).toBe(true)
      expect(todosPath.affects(store.state.todos)).toBe(true)
      expect(todosPath.affects(store.state.todos[0])).toBe(false)
      expect(todosPath.affects(store.state.todos[1])).toBe(false)

      expect(todo0Path.affects(store.state)).toBe(true)
      expect(todo0Path.affects(store.state.todos)).toBe(true)
      expect(todo0Path.affects(store.state.todos[0])).toBe(true)
      expect(todo0Path.affects(store.state.todos[1])).toBe(false)

      expect(todo1Path.affects(store.state)).toBe(true)
      expect(todo1Path.affects(store.state.todos)).toBe(true)
      expect(todo1Path.affects(store.state.todos[0])).toBe(false)
      expect(todo1Path.affects(store.state.todos[1])).toBe(true)
    })

    it("throws an error if the argument passed in is not a Path nor an ArborNode", () => {
      expect(() =>
        Path.root.affects("Not a path nor node" as unknown as Path)
      ).toThrow(InvalidArgumentError)
    })
  })
})
