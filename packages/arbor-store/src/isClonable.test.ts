import { Clonable } from "./Arbor"
import isClonable from "./isClonable"

class User implements Clonable<User> {
  $clone(): User {
    return new User()
  }
}

describe("isClonable", () => {
  it("checks if a type implements the 'Clonable' interface", () => {
    expect(isClonable(new User())).toBe(true)
    expect(isClonable({})).toBe(false)
    expect(isClonable([])).toBe(false)
    expect(isClonable(123 as any)).toBe(false)
    expect(isClonable("string")).toBe(false)
  })
})
