import Path from "./Path"
import isNode from "./isNode"

describe("isNode", () => {
  it("checks whether or not a given value is an Arbor Node", () => {
    expect(isNode({})).toEqual(false)
    expect(isNode(null)).toEqual(false)
    expect(isNode(undefined)).toEqual(false)
    expect(isNode({ $unwrap: "not a function" })).toEqual(false)
    expect(isNode({ $unwrap() {}, $path: "Not an instance of Path" })).toEqual(false)

    expect(isNode({ $unwrap() {}, $path: Path.root })).toEqual(true)
  })
})
