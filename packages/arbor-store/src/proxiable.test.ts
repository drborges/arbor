import proxiable from "./proxiable"

describe("proxiable", () => {
  it("returns false if value is not an object literal", () => {
    expect(proxiable(null)).toEqual(false)
    expect(proxiable(undefined)).toEqual(false)
    expect(proxiable(true)).toEqual(false)
    expect(proxiable(false)).toEqual(false)
    expect(proxiable(1)).toEqual(false)
    expect(proxiable(NaN)).toEqual(false)
    expect(proxiable("Some string")).toEqual(false)
    expect(proxiable("")).toEqual(false)
    expect(proxiable(new Date())).toEqual(false)
  })

  it("returns true if value is an object literal", () => {
    expect(proxiable({})).toEqual(true)
  })

  it("returns true if value is an array literal", () => {
    expect(proxiable([])).toEqual(true)
  })
})
