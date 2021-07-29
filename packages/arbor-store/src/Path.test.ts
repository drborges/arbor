import Path from "./Path"

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
})
