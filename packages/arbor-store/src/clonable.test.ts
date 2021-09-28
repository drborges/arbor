import clonable from "./clonable"

describe("clonable", () => {
  it("returns false if value does not support clonning behavior", () => {
    expect(clonable(null)).toEqual(false)
    expect(clonable(undefined)).toEqual(false)
    expect(clonable({})).toEqual(false)
    expect(clonable({ $clone: "not a function" })).toEqual(false)
  })

  it("returns true if value supports clonning behavior", () => {
    expect(clonable({ $clone() {} })).toEqual(true)
  })
})
