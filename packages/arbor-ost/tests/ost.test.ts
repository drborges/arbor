import { describe, expect, it, vi } from "vitest"

import { OST } from "../src/ost"

describe("OST", () => {
  describe("#createNode", () => {
    it("creates nodes for each proxiable object within the state value", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      }

      const ost = new OST()
      const $rootNode = ost.createNode(state)
      const $todosNode = $rootNode.$createChild(state.todos)
      const $todo1Node = $todosNode.$createChild(state.todos[0])
      const $todo2Node = $todosNode.$createChild(state.todos[1])

      expect(ost).toHaveNodeValuePair([$rootNode, state])
      expect(ost).toHaveNodeValuePair([$todosNode, state.todos])
      expect(ost).toHaveNodeValuePair([$todo1Node, state.todos[0]])
      expect(ost).toHaveNodeValuePair([$todo2Node, state.todos[1]])

      expect($rootNode).toHaveParentNode(undefined)
      expect($todosNode).toHaveParentNode($rootNode)
      expect($todo1Node).toHaveParentNode($todosNode)
      expect($todo2Node).toHaveParentNode($todosNode)
    })
  })

  describe("#humanizePath", () => {
    it("creates a string representation of OST paths", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor" },
          { id: 2, content: "Implement OST" },
        ],
      }

      const ost = new OST()
      const $rootNode = ost.createNode(state)
      const $todosNode = $rootNode.$createChild(state.todos)
      const $todo1Node = $todosNode.$createChild(state.todos[0])
      const $todo2Node = $todosNode.$createChild(state.todos[1])

      expect(ost.humanizePath($rootNode.$path)).toEqual(
        `${$rootNode.$seed.value}`
      )
      expect(ost.humanizePath($todosNode.$path)).toEqual(
        `${$rootNode.$seed.value} -> ${$todosNode.$seed.value}`
      )
      expect(ost.humanizePath($todo1Node.$path)).toEqual(
        `${$rootNode.$seed.value} -> ${$todosNode.$seed.value} -> ${$todo1Node.$seed.value}`
      )
      expect(ost.humanizePath($todo2Node.$path)).toEqual(
        `${$rootNode.$seed.value} -> ${$todosNode.$seed.value} -> ${$todo2Node.$seed.value}`
      )
    })

    it("marks detached seeds in the path", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor", author: { name: "Alice" } },
          { id: 2, content: "Implement OST", author: { name: "Bob" } },
        ],
      }

      const ost = new OST()
      const $rootNode = ost.createNode(state)
      const $todosNode = $rootNode.$createChild(state.todos)
      const $todo1Node = $todosNode.$createChild(state.todos[0])
      const todo2Node = $todosNode.$createChild(state.todos[1])
      const todo1AuthorNode = $todo1Node.$createChild(state.todos[0].author)
      const todo2AuthorNode = todo2Node.$createChild(state.todos[1].author)

      state.todos.shift()

      expect(ost.humanizePath($rootNode.$path)).toEqual(
        `${$rootNode.$seed.value}`
      )
      expect(ost.humanizePath($todosNode.$path)).toEqual(
        `${$rootNode.$seed.value} -> ${$todosNode.$seed.value}`
      )
      expect(ost.humanizePath($todo1Node.$path)).toEqual(
        `${$rootNode.$seed.value} -> ${$todosNode.$seed.value} -> ${$todo1Node.$seed.value}*`
      )
      expect(ost.humanizePath(todo1AuthorNode.$path)).toEqual(
        `${$rootNode.$seed.value} -> ${$todosNode.$seed.value} -> ${$todo1Node.$seed.value}* -> ${todo1AuthorNode.$seed.value}`
      )
      expect(ost.humanizePath(todo2Node.$path)).toEqual(
        `${$rootNode.$seed.value} -> ${$todosNode.$seed.value} -> ${todo2Node.$seed.value}`
      )
      expect(ost.humanizePath(todo2AuthorNode.$path)).toEqual(
        `${$rootNode.$seed.value} -> ${$todosNode.$seed.value} -> ${todo2Node.$seed.value} -> ${todo2AuthorNode.$seed.value}`
      )
    })
  })

  describe("#isDetached", () => {
    it("returns true if argument is null or undefined", () => {
      const ost = new OST()

      expect(ost.isDetached(null)).toBe(true)
      expect(ost.isDetached(undefined)).toBe(true)
    })

    it("returns true if value referenced by path is no longer in the state tree", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor", author: { name: "Alice" } },
          { id: 2, content: "Implement OST", author: { name: "Bob" } },
        ],
      }

      const ost = new OST()
      const $rootNode = ost.createNode(state)
      const $todosNode = $rootNode.$createChild(state.todos)
      const $todo1Node = $todosNode.$createChild(state.todos[0])
      const $todo2Node = $todosNode.$createChild(state.todos[1])
      const $todo1AuthorNode = $todo1Node.$createChild(state.todos[0].author)
      const $todo2AuthorNode = $todo2Node.$createChild(state.todos[1].author)

      state.todos.shift()

      expect($rootNode).not.toBeDetachedFrom(ost)
      expect($todosNode).not.toBeDetachedFrom(ost)
      expect($todo1Node).toBeDetachedFrom(ost)
      expect($todo1AuthorNode).toBeDetachedFrom(ost)
      expect($todo2Node).not.toBeDetachedFrom(ost)
      expect($todo2AuthorNode).not.toBeDetachedFrom(ost)
    })
  })

  describe("#mutate", () => {
    it("refreshes the nodes in the mutation path with new memory references", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor", author: { name: "Alice" } },
          { id: 2, content: "Implement OST", author: { name: "Bob" } },
        ],
      }

      const ost = new OST()
      const $rootNode = ost.createNode(state)
      const $todosNode = $rootNode.$createChild(state.todos)
      const $todo1Node = $todosNode.$createChild(state.todos[0])
      const $todo2Node = $todosNode.$createChild(state.todos[1])
      const $todo1AuthorNode = $todo1Node.$createChild(state.todos[0].author)
      const $todo2AuthorNode = $todo2Node.$createChild(state.todos[1].author)

      ost.mutate($todo1Node, (todo1) => {
        todo1.content = "Learn Arbor OST"

        return {
          operation: "set",
          props: ["content"],
        }
      })

      expect(state.todos[0].content).toEqual("Learn Arbor OST")
      expect($todo1Node.$value.content).toEqual("Learn Arbor OST")

      const $newRootNode = ost.root
      const $newTodosNode = ost.nodeOf(state.todos)
      const $newTodo1Node = ost.nodeOf(state.todos[0])
      const $newTodo2Node = ost.nodeOf(state.todos[1])
      const $newTodo1AuthorNode = ost.nodeOf(state.todos[0].author)
      const $newTodo2AuthorNode = ost.nodeOf(state.todos[1].author)

      expect($newRootNode).not.toBe($rootNode)
      expect($newRootNode.$value).toBe(state)
      expect($newTodosNode).not.toBe($todosNode)
      expect($newTodosNode.$value).toBe($todosNode.$value)
      expect($newTodo1Node).not.toBe($todo1Node)
      expect($newTodo1Node.$value).toBe($todo1Node.$value)
      expect($newTodo1AuthorNode).toBe($todo1AuthorNode)
      expect($newTodo2Node).toBe($todo2Node)
      expect($newTodo2AuthorNode).toBe($todo2AuthorNode)
    })

    it("returns the new reference of the mutated node", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor", author: { name: "Alice" } },
          { id: 2, content: "Implement OST", author: { name: "Bob" } },
        ],
      }

      const ost = new OST(state)
      const nodeToMutate = ost.root.todos[0].author

      const mutatedNode = ost.mutate(nodeToMutate, (author) => {
        author.name = "Alice Doe"

        return {
          operation: "set",
          props: ["name"]
        }
      })

      expect(mutatedNode).not.toBe(nodeToMutate)
      expect(mutatedNode.$seed).toBe(nodeToMutate.$seed)
    })

    it("notifies all subscribers affected by the mutation path", () => {
      const state = {
        todos: [
          { id: 1, content: "Learn Arbor", author: { name: "Alice" } },
          { id: 2, content: "Implement OST", author: { name: "Bob" } },
        ],
      }

      const ost = new OST()
      const $rootNode = ost.createNode(state)
      const $todosNode = $rootNode.$createChild(state.todos)
      const $todo1Node = $todosNode.$createChild(state.todos[0])
      const $todo2Node = $todosNode.$createChild(state.todos[1])
      const $todo1AuthorNode = $todo1Node.$createChild(state.todos[0].author)
      const $todo2AuthorNode = $todo2Node.$createChild(state.todos[1].author)

      const subscriberOfAllMutations = vi.fn()
      const rootNodeSubscriber = vi.fn()
      const todosNodeSubscriber = vi.fn()
      const todo1NodeSubscriber = vi.fn()
      const todo1AuthorNodeSubscriber = vi.fn()
      const todo2NodeSubscriber = vi.fn()
      const todo2AuthorNodeSubscriber = vi.fn()

      ost.subscribe(subscriberOfAllMutations)
      ost.subscribeTo($rootNode, rootNodeSubscriber)
      ost.subscribeTo($todosNode, todosNodeSubscriber)
      ost.subscribeTo($todo1Node, todo1NodeSubscriber)
      ost.subscribeTo($todo1AuthorNode, todo1AuthorNodeSubscriber)
      ost.subscribeTo($todo2Node, todo2NodeSubscriber)
      ost.subscribeTo($todo2AuthorNode, todo2AuthorNodeSubscriber)

      ost.mutate($todo1Node, (todo1) => {
        todo1.content = "Learn Arbor OST"

        return {
          operation: "set",
          props: ["content"],
          previousValue: "Learn Arbor",
        }
      })

      expect(subscriberOfAllMutations).toHaveBeenCalledTimes(1)
      expect(rootNodeSubscriber).toHaveBeenCalledTimes(1)
      expect(todosNodeSubscriber).toHaveBeenCalledTimes(1)
      expect(todo1NodeSubscriber).toHaveBeenCalledTimes(1)
      expect(todo1AuthorNodeSubscriber).toHaveBeenCalledTimes(0)
      expect(todo2NodeSubscriber).toHaveBeenCalledTimes(0)
      expect(todo2AuthorNodeSubscriber).toHaveBeenCalledTimes(0)
    })
  })
})
