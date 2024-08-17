import { describe, expect, it } from "vitest"
import { Arbor } from "../../src/arbor"
import { NotAnArborNodeError, DetachedNodeError } from "../../src/errors"
import { Path, Seed } from "../../src/path"
import { pathFor, detach } from "../../src/utilities"

describe("pathFor", () => {
  it("cannot determine a path for a value that is not attached to the state tree", () => {
    const node = { name: "Alice", age: 32 }

    expect(() => {
      pathFor(node)
    }).toThrow(NotAnArborNodeError)
  })

  it("cannot determine a path for a detached node", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes" },
        { id: 2, text: "Walk the dogs" },
      ],
    })

    const node = store.state.todos[0]
    detach(node)

    expect(() => {
      pathFor(node)
    }).toThrow(DetachedNodeError)
  })

  it("determines the path of the node within the state tree", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes" },
        { id: 2, text: "Walk the dogs" },
      ],
    })

    const rootPath = Path.root(Seed.from(store.state))
    const todosPath = rootPath.child(Seed.from(store.state.todos))
    const todo0Path = todosPath.child(Seed.from(store.state.todos[0]))
    const todo1Path = todosPath.child(Seed.from(store.state.todos[1]))

    expect(pathFor(store.state)).toEqual(rootPath)
    expect(pathFor(store.state.todos)).toEqual(todosPath)
    expect(pathFor(store.state.todos[0])).toEqual(todo0Path)
    expect(pathFor(store.state.todos[1])).toEqual(todo1Path)
  })
})
