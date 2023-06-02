/* eslint-disable @typescript-eslint/no-empty-function */
import { isNode } from "./guards"

describe("isNode", () => {
  it("checks whether or not a given value is an Arbor Node", () => {
    expect(isNode(null)).toEqual(false)
    expect(isNode(undefined)).toEqual(false)
    expect(isNode({})).toEqual(false)
    expect(isNode({ $unwrap: "not a function" })).toEqual(false)
    expect(isNode({ $unwrap() {} })).toEqual(true)
  })
})
