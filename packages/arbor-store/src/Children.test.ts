import Arbor from "./Arbor"
import Children from "./Children"
import Path from "./Path"

interface User {
  name: string
}

describe("Children", () => {
  describe("#set", () => {
    it("caches a node by its value", () => {
      const tree = new Arbor<User[]>([])
      const cache = new Children()
      const value = { name: "Bob" }
      const node = tree.createNode(new Path("0"), value)

      expect(cache.has(value)).toBeFalsy()

      cache.set(value, node)

      expect(cache.has(value)).toBeTruthy()
    })
  })

  describe("#delete", () => {
    it("removes a node from the cache by its value", () => {
      const tree = new Arbor<User[]>([])
      const cache = new Children()
      const value = { name: "Bob" }
      const node = tree.createNode(new Path("0"), value)

      cache.set(value, node)

      expect(cache.has(value)).toBeTruthy()

      cache.delete(value)

      expect(cache.has(value)).toBeFalsy()
    })
  })

  describe("#get", () => {
    it("retrieves a node from the cache by its value", () => {
      const tree = new Arbor<User[]>([])
      const cache = new Children()
      const value = { name: "Bob" }
      const node = tree.createNode(new Path("0"), value)

      cache.set(value, node)

      expect(cache.get(value)).toBe(node)
    })
  })

  describe("#reset", () => {
    it("clears up the cache", () => {
      const tree = new Arbor<User[]>([])
      const cache = new Children()
      const value1 = { name: "Bob" }
      const node1 = tree.createNode(new Path("0"), value1)
      const value2 = { name: "Bob" }
      const node2 = tree.createNode(new Path("0"), value2)

      cache.set(value1, node1)
      cache.set(value2, node2)

      cache.reset()

      expect(cache.has(value1)).toBeFalsy()
      expect(cache.has(value2)).toBeFalsy()
    })
  })
})
