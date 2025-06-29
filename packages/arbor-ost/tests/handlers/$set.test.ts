import { describe, expect, it, vi } from "vitest"

import { OST } from "../../src/ost"
import { node } from "../../src/decorators/node"

describe("$set", () => {
  describe("#add", () => {
    it("mutates the underlying value", () => {
      const todos = new Set()
      const newTodoValue = { id: 3, content: "Learn LLM" }
      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.add(newTodoValue)

      expect(ost.root.$value).toBe(state)
      expect(ost.root.todos.$value).toBe(todos)
      expect(ost.root.todos.size).toEqual(1)
      expect(ost.root.todos.has(newTodoValue)).toBe(true)

      const iterator = ost.root.todos.values()
      const todoNode = iterator.next().value

      expect(todoNode).toBe(ost.nodeOf(newTodoValue))
      expect(ost.root.todos.has(todoNode)).toBe(true)
    })

    it("can store non-proxiable values", () => {
      const todos = new Set()
      const ost = new OST({ todos })

      ost.root.todos.add("Learn LLM")

      expect(ost.root.todos.size).toEqual(1)
      expect(ost.root.todos.has("Learn LLM")).toBe(true)
    })

    it("notifies subscribers of a new item in the array", () => {
      const todos = new Set()
      const ost = new OST({ todos })
      const newTodoValue = { id: 3, content: "Learn LLM" }
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.add(newTodoValue)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todos = new Set()
      const ost = new OST({ todos })
      const subscriber = vi.fn()

      ost.subscribe(subscriber)

      return new Promise((resolve) => {
        const newTodoValue = { id: 3, content: "Learn LLM" }

        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([newTodoValue])
          expect(event.metadata.operation).toEqual("add")
          resolve(true)
        })

        ost.root.todos.add(newTodoValue)
      })
    })
  })

  describe("#delete", () => {
    it("mutates the underlying value", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.delete(todo2)

      expect(ost.root.todos.size).toEqual(1)
      expect(ost.root.todos.has(todo2)).toBe(false)
      expect(ost.root.todos.has(todo1)).toBe(true)
    })

    it("notifies subscribers of a deleted item", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.delete(todo2)

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("does not notify subscribers if deleted value does not exist in the set", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.delete({ id: 3, content: "Not in set" })

      expect(subscriber).not.toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([todo2])
          expect(event.metadata.operation).toEqual("delete")
          resolve(true)
        })

        ost.root.todos.delete(todo2)
      })
    })
  })

  describe("#clear", () => {
    it("mutates the underlying value", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.clear()

      expect(ost.root.todos.size).toEqual(0)
      expect(ost.root.todos.has(todo1)).toBe(false)
      expect(ost.root.todos.has(todo2)).toBe(false)
    })

    it("notifies subscribers of clear operation", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.clear()

      expect(subscriber).toHaveBeenCalledOnce()
    })

    it("does not notify subscribers if set is already empty", () => {
      const todos = new Set()

      const state = { todos }
      const ost = new OST(state)
      const subscriber = vi.fn()

      ost.subscribe(subscriber)
      ost.root.todos.clear()

      expect(subscriber).not.toHaveBeenCalledOnce()
    })

    it("exposes mutation event metadata to subscribers", async () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      return new Promise((resolve) => {
        ost.subscribe((event) => {
          expect(event.target).toBe(ost.root.todos)
          expect(event.metadata.args).toEqual([])
          expect(event.metadata.operation).toEqual("clear")
          resolve(true)
        })

        ost.root.todos.clear()
      })
    })
  })

  describe("#has", () => {
    it("returns true if the given value exists in the set", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      expect(ost.root.todos.has(todo1)).toBe(true)
      expect(ost.root.todos.has(todo2)).toBe(true)
      expect(ost.root.todos.has({ id: 3, content: "Not in set" })).toBe(false)
    })
  })

  describe("#entries", () => {
    it("returns an iterator that exposes the value and value pair (as per Set semantics)", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.entries()
      const entries = []

      let result = iterator.next()
      while (!result.done) {
        entries.push(result.value)
        result = iterator.next()
      }

      expect(entries.length).toBe(2)
      expect(entries[0][0]).toBe(entries[0][1]) // Set entries have same value for key and value
      expect(entries[1][0]).toBe(entries[1][1])
      expect(entries[0][0].$value).toBe(todo1)
      expect(entries[1][0].$value).toBe(todo2)
    })

    it("lazily creates nodes for entries accessed", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.entries()

      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).toHaveNodeFor(todo2)
    })
  })

  describe("#forEach", () => {
    it("iterates over the values of the set", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const values = []
      ost.root.todos.forEach((value1, value2, set) => {
        values.push({ value1, value2 })
        expect(value1).toBe(value2) // Set forEach passes same value twice
        expect(set).toBe(ost.root.todos)
      })

      expect(values.length).toBe(2)
      expect(values[0].value1.$value).toBe(todo1)
      expect(values[1].value1.$value).toBe(todo2)
    })
  })

  describe("#keys", () => {
    it("returns an iterator over the values of the set (same as values for Set)", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.keys()
      const keys = []

      let result = iterator.next()
      while (!result.done) {
        keys.push(result.value)
        result = iterator.next()
      }

      expect(keys.length).toBe(2)
      expect(keys[0].$value).toBe(todo1)
      expect(keys[1].$value).toBe(todo2)
    })

    it("lazily creates nodes for entries accessed", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.keys()

      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).toHaveNodeFor(todo2)
    })
  })

  describe("#values", () => {
    it("returns an iterator over the node values of the set", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.values()
      const values = []

      let result = iterator.next()
      while (!result.done) {
        values.push(result.value)
        result = iterator.next()
      }

      expect(values.length).toBe(2)
      expect(values[0].$value).toBe(todo1)
      expect(values[1].$value).toBe(todo2)
    })

    it("lazily creates nodes for entries accessed", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos.values()

      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).toHaveNodeFor(todo2)
    })
  })

  describe("#Symbol.iterator", () => {
    it("returns an iterator that exposes the value and value pair (as per Set semantics)", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos[Symbol.iterator]()
      const entries = []

      let result = iterator.next()
      while (!result.done) {
        entries.push(result.value)
        result = iterator.next()
      }

      expect(entries.length).toBe(2)
      expect(entries[0][0]).toBe(entries[0][1]) // Set iterator has same value for key and value
      expect(entries[1][0]).toBe(entries[1][1])
      expect(entries[0][0].$value).toBe(todo1)
      expect(entries[1][0].$value).toBe(todo2)
    })

    it("lazily creates nodes for entries accessed", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new Set()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      const iterator = ost.root.todos[Symbol.iterator]()

      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).toHaveNodeFor(todo2)
    })
  })

  describe("custom @node sets", () => {
    @node
    class MySet extends Set {
      get first() {
        return this.values().next().value
      }

      get last() {
        let lastTodo = null

        for (const todo of this.values()) {
          lastTodo = todo
        }

        return lastTodo
      }

      deleteLast() {
        this.delete(this.last)
      }
    }

    it("supports custom Set types when decorated with @node", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new MySet()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      expect(ost).not.toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      const iterator = ost.root.todos[Symbol.iterator]()

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).not.toHaveNodeFor(todo2)

      iterator.next()

      expect(ost).toHaveNodeFor(todo1)
      expect(ost).toHaveNodeFor(todo2)

      expect(ost.root.todos.first.$value).toBe(todo1)
    })

    it("executes custom methods within the context of the proxy", () => {
      const todo1 = { id: 1, content: "Learn Arbor" }
      const todo2 = { id: 2, content: "Implement OST" }
      const todos = new MySet()
      todos.add(todo1)
      todos.add(todo2)

      const state = { todos }
      const ost = new OST(state)

      ost.root.todos.deleteLast()

      expect(ost.root.todos.size).toBe(1)
      expect(ost.root.todos.has(todo2)).toBe(false)
      expect(ost.root.todos.has(todo1)).toBe(true)
    })
  })

  describe("Set composition methods", () => {
    describe("#difference", () => {
      it("returns a new set with elements in this set but not in the given set", () => {
        const setA = new Set([1, 2, 3, 4])
        const setB = new Set([3, 4, 5, 6])
        const state = { setA, setB }
        const ost = new OST(state)

        const result = ost.root.setA.difference(ost.root.setB)

        expect(result).toBeInstanceOf(Set)
        expect([...result]).toEqual([1, 2])
      })

      it("wraps proxiable values in OST nodes", () => {
        const obj1 = { id: 1, name: "first" }
        const obj2 = { id: 2, name: "second" }
        const obj3 = { id: 3, name: "third" }
        const setA = new Set([obj1, obj2, obj3])
        const setB = new Set([obj2])
        const state = { setA, setB }
        const ost = new OST(state)

        const result = ost.root.setA.difference(ost.root.setB)

        expect(result).toBeInstanceOf(Set)
        expect(result.size).toBe(2)

        const resultArray = [...result]
        expect(ost).toHaveNodeValuePair([resultArray[0], obj1])
        expect(ost).toHaveNodeValuePair([resultArray[1], obj3])
      })
    })

    describe("#intersection", () => {
      it("returns a new set with elements in both sets", () => {
        const setA = new Set([1, 2, 3, 4])
        const setB = new Set([3, 4, 5, 6])
        const state = { setA, setB }
        const ost = new OST(state)

        const result = ost.root.setA.intersection(ost.root.setB)

        expect(result).toBeInstanceOf(Set)
        expect([...result]).toEqual([3, 4])
      })

      it("wraps proxiable values in OST nodes", () => {
        const obj1 = { id: 1, name: "first" }
        const obj2 = { id: 2, name: "second" }
        const obj3 = { id: 3, name: "third" }
        const setA = new Set([obj1, obj2])
        const setB = new Set([obj2, obj3])
        const state = { setA, setB }
        const ost = new OST(state)

        const result = ost.root.setA.intersection(ost.root.setB)

        expect(result).toBeInstanceOf(Set)
        expect(result.size).toBe(1)

        const resultArray = [...result]
        expect(ost).toHaveNodeValuePair([resultArray[0], obj2])
      })
    })

    describe("#union", () => {
      it("returns a new set with elements from both sets", () => {
        const setA = new Set([1, 2, 3])
        const setB = new Set([3, 4, 5])
        const state = { setA, setB }
        const ost = new OST(state)

        const result = ost.root.setA.union(ost.root.setB)

        expect(result).toBeInstanceOf(Set)
        expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
      })

      it("wraps proxiable values in OST nodes", () => {
        const obj1 = { id: 1, name: "first" }
        const obj2 = { id: 2, name: "second" }
        const obj3 = { id: 3, name: "third" }
        const setA = new Set([obj1, obj2])
        const setB = new Set([obj2, obj3])
        const state = { setA, setB }
        const ost = new OST(state)

        const result = ost.root.setA.union(ost.root.setB)

        expect(result).toBeInstanceOf(Set)
        expect(result.size).toBe(3)

        const resultArray = [...result]
        expect(ost).toHaveNodeValuePair([resultArray[0], obj1])
        expect(ost).toHaveNodeValuePair([resultArray[1], obj2])
        expect(ost).toHaveNodeValuePair([resultArray[2], obj3])
      })
    })

    describe("#symmetricDifference", () => {
      it("returns a new set with elements in either set but not both", () => {
        const setA = new Set([1, 2, 3])
        const setB = new Set([3, 4, 5])
        const state = { setA, setB }
        const ost = new OST(state)

        const result = ost.root.setA.symmetricDifference(ost.root.setB)

        expect(result).toBeInstanceOf(Set)
        expect([...result].sort()).toEqual([1, 2, 4, 5])
      })

      it("wraps proxiable values in OST nodes", () => {
        const obj1 = { id: 1, name: "first" }
        const obj2 = { id: 2, name: "second" }
        const obj3 = { id: 3, name: "third" }
        const setA = new Set([obj1, obj2])
        const setB = new Set([obj2, obj3])
        const state = { setA, setB }
        const ost = new OST(state)

        const result = ost.root.setA.symmetricDifference(ost.root.setB)

        expect(result).toBeInstanceOf(Set)
        expect(result.size).toBe(2)

        const resultArray = [...result]
        expect(ost).toHaveNodeValuePair([resultArray[0], obj1])
        expect(ost).toHaveNodeValuePair([resultArray[1], obj3])
      })
    })

    describe("#isDisjointFrom", () => {
      it("returns true if sets have no elements in common", () => {
        const setA = new Set([1, 2])
        const setB = new Set([3, 4])
        const setC = new Set([2, 3])
        const state = { setA, setB, setC }
        const ost = new OST(state)

        expect(ost.root.setA.isDisjointFrom(ost.root.setB)).toBe(true)
        expect(ost.root.setA.isDisjointFrom(ost.root.setC)).toBe(false)
      })

      it("works with proxiable values", () => {
        const obj1 = { id: 1, name: "first" }
        const obj2 = { id: 2, name: "second" }
        const obj3 = { id: 3, name: "third" }
        const setA = new Set([obj1])
        const setB = new Set([obj2])
        const setC = new Set([obj1, obj3])
        const state = { setA, setB, setC }
        const ost = new OST(state)

        expect(ost.root.setA.isDisjointFrom(ost.root.setB)).toBe(true)
        expect(ost.root.setA.isDisjointFrom(ost.root.setC)).toBe(false)
      })
    })

    describe("#isSubsetOf", () => {
      it("returns true if all elements of this set are in the given set", () => {
        const setA = new Set([1, 2])
        const setB = new Set([1, 2, 3, 4])
        const setC = new Set([1, 5])
        const state = { setA, setB, setC }
        const ost = new OST(state)

        expect(ost.root.setA.isSubsetOf(ost.root.setB)).toBe(true)
        expect(ost.root.setA.isSubsetOf(ost.root.setC)).toBe(false)
      })

      it("works with proxiable values", () => {
        const obj1 = { id: 1, name: "first" }
        const obj2 = { id: 2, name: "second" }
        const obj3 = { id: 3, name: "third" }
        const setA = new Set([obj1, obj2])
        const setB = new Set([obj1, obj2, obj3])
        const setC = new Set([obj1, obj3])
        const state = { setA, setB, setC }
        const ost = new OST(state)

        expect(ost.root.setA.isSubsetOf(ost.root.setB)).toBe(true)
        expect(ost.root.setA.isSubsetOf(ost.root.setC)).toBe(false)
      })
    })

    describe("#isSupersetOf", () => {
      it("returns true if all elements of the given set are in this set", () => {
        const setA = new Set([1, 2, 3, 4])
        const setB = new Set([1, 2])
        const setC = new Set([1, 5])
        const state = { setA, setB, setC }
        const ost = new OST(state)

        expect(ost.root.setA.isSupersetOf(ost.root.setB)).toBe(true)
        expect(ost.root.setA.isSupersetOf(ost.root.setC)).toBe(false)
      })

      it("works with proxiable values", () => {
        const obj1 = { id: 1, name: "first" }
        const obj2 = { id: 2, name: "second" }
        const obj3 = { id: 3, name: "third" }
        const setA = new Set([obj1, obj2, obj3])
        const setB = new Set([obj1, obj2])
        const setC = new Set([obj1, { id: 4, name: "fourth" }])
        const state = { setA, setB, setC }
        const ost = new OST(state)

        expect(ost.root.setA.isSupersetOf(ost.root.setB)).toBe(true)
        expect(ost.root.setA.isSupersetOf(ost.root.setC)).toBe(false)
      })
    })
  })

  describe("Edge cases and comprehensive tests", () => {
    it("should handle empty sets in composition methods", () => {
      const emptySet = new Set()
      const filledSet = new Set([1, 2, 3])
      const state = { emptySet, filledSet }
      const ost = new OST(state)

      expect(ost.root.emptySet.difference(ost.root.filledSet).size).toBe(0)
      expect(ost.root.filledSet.difference(ost.root.emptySet).size).toBe(3)
      expect(ost.root.emptySet.intersection(ost.root.filledSet).size).toBe(0)
      expect(ost.root.emptySet.union(ost.root.filledSet).size).toBe(3)
      expect(
        ost.root.emptySet.symmetricDifference(ost.root.filledSet).size
      ).toBe(3)

      expect(ost.root.emptySet.isDisjointFrom(ost.root.filledSet)).toBe(true)
      expect(ost.root.emptySet.isSubsetOf(ost.root.filledSet)).toBe(true)
      expect(ost.root.filledSet.isSupersetOf(ost.root.emptySet)).toBe(true)
    })

    it("should handle identical sets in composition methods", () => {
      const setA = new Set([1, 2, 3])
      const setB = new Set([1, 2, 3])
      const state = { setA, setB }
      const ost = new OST(state)

      expect(ost.root.setA.difference(ost.root.setB).size).toBe(0)
      expect(ost.root.setA.intersection(ost.root.setB).size).toBe(3)
      expect(ost.root.setA.union(ost.root.setB).size).toBe(3)
      expect(ost.root.setA.symmetricDifference(ost.root.setB).size).toBe(0)

      expect(ost.root.setA.isDisjointFrom(ost.root.setB)).toBe(false)
      expect(ost.root.setA.isSubsetOf(ost.root.setB)).toBe(true)
      expect(ost.root.setA.isSupersetOf(ost.root.setB)).toBe(true)
    })

    it("should handle mixed types (proxiable and non-proxiable) in composition methods", () => {
      const obj1 = { id: 1, name: "obj1" }
      const obj2 = { id: 2, name: "obj2" }
      const setA = new Set([obj1, "string1", 42])
      const setB = new Set([obj2, "string1", 99])
      const state = { setA, setB }
      const ost = new OST(state)

      const intersection = ost.root.setA.intersection(ost.root.setB)
      expect(intersection.size).toBe(1)
      expect([...intersection][0]).toBe("string1")

      const union = ost.root.setA.union(ost.root.setB)
      expect(union.size).toBe(5)

      const difference = ost.root.setA.difference(ost.root.setB)
      const diffArray = [...difference]

      expect(difference.size).toBe(2)
      expect(ost).toHaveNodeValuePair([diffArray[0], obj1])
      expect(diffArray[1]).toEqual(42)
    })

    it("should handle Set methods chaining", () => {
      const obj1 = { id: 1, name: "first" }
      const obj2 = { id: 2, name: "second" }
      const todos = new Set()
      const state = { todos }
      const ost = new OST(state)

      // Test method chaining with add
      const result = ost.root.todos.add(obj1).add(obj2)
      expect(result).toBe(ost.root.todos)
      expect(ost.root.todos.size).toBe(2)
      expect(ost.root.todos.has(obj1)).toBe(true)
      expect(ost.root.todos.has(obj2)).toBe(true)
    })

    it("should properly handle node caching across composition methods", () => {
      const obj1 = { id: 1, name: "first" }
      const obj2 = { id: 2, name: "second" }
      const setA = new Set([obj1, obj2])
      const setB = new Set([obj2])
      const state = { setA, setB }
      const ost = new OST(state)

      expect(ost).not.toHaveNodeFor(obj1)
      expect(ost).not.toHaveNodeFor(obj2)

      // Access obj1 through intersection
      const intersection = ost.root.setA.intersection(ost.root.setB)
      const intersectionArray = [...intersection]

      expect(ost).toHaveNodeFor(obj2)
      expect(ost).not.toHaveNodeFor(obj1)

      // Now access obj1 through difference
      const difference = ost.root.setA.difference(ost.root.setB)
      const differenceArray = [...difference]

      expect(ost).toHaveNodeFor(obj1)
      expect(ost).toHaveNodeFor(obj2)

      // Verify same node instances are returned
      expect(intersectionArray[0]).toBe(ost.nodeOf(obj2))
      expect(differenceArray[0]).toBe(ost.nodeOf(obj1))
    })
  })
})
