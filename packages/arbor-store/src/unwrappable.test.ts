import unwrappable from "./unwrappable"

describe("unwrappable", () => {
  it("checks whether or not a given value is unwrappable", () => {
    expect(unwrappable(null)).toEqual(false)
    expect(unwrappable(undefined)).toEqual(false)
    expect(unwrappable({})).toEqual(false)
    expect(unwrappable({ $unwrap: "not a function" })).toEqual(false)
    expect(unwrappable({ $unwrap() {} })).toEqual(true)
  })
})
