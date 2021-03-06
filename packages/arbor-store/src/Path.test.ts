import Path from "./Path"
import { ArborNode } from "./Arbor"
import { InvalidArgumentError } from "./errors"

describe("Path", () => {
  describe("#toString", () => {
    it("represents an empty path as '/'", () => {
      const path = new Path()

      expect(path.toString()).toEqual("/")
    })

    it("returns a URI representation of the object", () => {
      const path = new Path("users", "0", "preferences")

      expect(path.toString()).toEqual("/users/0/preferences")
    })
  })

  describe("#child", () => {
    it("creates a child path", () => {
      const parent = new Path("users")
      const child = parent.child("0")

      expect(child.toString()).toEqual("/users/0")
    })
  })

  describe("#isRoot", () => {
    it("checks if a path points to the root of a state tree", () => {
      expect(Path.parse("").isRoot()).toBe(true)
      expect(Path.parse("/").isRoot()).toBe(true)
      expect(Path.parse("/users").isRoot()).toBe(false)
    })
  })

  describe("#parent", () => {
    it("returns the parent path", () => {
      const path = new Path("users", "0")

      expect(path.parent.toString()).toEqual("/users")
    })

    it("returns the parent path of a root path", () => {
      const path = new Path()

      expect(path.parent).toEqual(null)
    })
  })

  describe("#parse", () => {
    it("parses the given string into a Path object", () => {
      const path1 = Path.parse("")
      const path2 = Path.parse("/")
      const path3 = Path.parse("/users")

      expect(path1.props).toEqual([])
      expect(path2.props).toEqual([])
      expect(path3.props).toEqual(["users"])
    })

    it("returns the parent path of a root path", () => {
      const path = new Path()

      expect(path.parent).toEqual(null)
    })
  })

  describe(".root", () => {
    it("creates a root path", () => {
      const path = Path.root

      expect(path.props).toEqual([])
    })
  })

  describe("#walk", () => {
    it("traverses a given object until it reaches the node represented by the path", () => {
      const path = Path.parse("/state/users/1")
      const obj = {
        state: {
          users: [{ name: "User 1" }, { name: "User 2" }],
        },
      }

      expect(path.walk(obj)).toBe(obj.state.users[1])
    })
  })

  describe("#targets", () => {
    it("checks if a path targets another given path", () => {
      expect(Path.root.targets(Path.root)).toBe(true)
      expect(Path.parse("/").targets(Path.root)).toBe(true)
      expect(new Path("users").targets(Path.parse("/users"))).toBe(true)
      expect(Path.parse("/users").targets(Path.parse("/users"))).toBe(true)

      expect(Path.parse("/users").targets(Path.root)).toBe(false)
      expect(new Path("users").targets(Path.parse("/"))).toBe(false)
      expect(Path.parse("/users/123").targets(Path.parse("/users"))).toBe(false)
    })

    it("checks if a path targets a given ArborNode", () => {
      const node1 = {
        $unwrap() {},
        $path: Path.parse("/users"),
      } as ArborNode<any>

      const node2 = {
        $unwrap() {},
        $path: Path.parse("/users/123"),
      } as ArborNode<any>

      expect(Path.parse("/").targets(node1)).toBe(false)
      expect(Path.parse("/").targets(node2)).toBe(false)
      expect(Path.parse("/users").targets(node1)).toBe(true)
      expect(Path.parse("/users").targets(node2)).toBe(false)
      expect(Path.parse("/users/123").targets(node1)).toBe(false)
      expect(Path.parse("/users/123").targets(node2)).toBe(true)
    })

    it("throws an error if the argument passed in is not a Path nor an ArborNode", () => {
      expect(() =>
        Path.parse(".").targets("Not a path nor node" as unknown as Path)
      ).toThrowError(InvalidArgumentError)
    })
  })

  describe("#affects", () => {
    it("checks if a path affects a given node", () => {
      const node1 = {
        $unwrap() {},
        $path: Path.parse("/users"),
      } as ArborNode<any>

      const node2 = {
        $unwrap() {},
        $path: Path.parse("/users/123"),
      } as ArborNode<any>

      expect(Path.parse("/users").affects(node1)).toBe(true)
      expect(Path.parse("/users/321").affects(node1)).toBe(true)
      expect(Path.parse("/users/123").affects(node1)).toBe(true)
      expect(Path.parse("/users/123").affects(node2)).toBe(true)

      expect(Path.parse("/posts").affects(node1)).toBe(false)
      expect(Path.parse("/posts").affects(node2)).toBe(false)
      expect(Path.parse("/users").affects(node2)).toBe(false)
      expect(Path.parse("/users/321").affects(node2)).toBe(false)
    })
  })
})
