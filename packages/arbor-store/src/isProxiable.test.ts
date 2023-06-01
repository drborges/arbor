/* eslint-disable max-classes-per-file */
/* eslint-disable no-new-wrappers */
import { Proxiable } from "./Arbor"
import isProxiable, { ArborProxiable } from "./isProxiable"

class NotProxiable {}
class Users extends Array {}
@Proxiable()
class User {}
class ProxiableType {
  [ArborProxiable] = true
}

describe("isProxiable", () => {
  it("considers proxiable object literals", () => {
    expect(isProxiable({})).toBe(true)
  })

  it("considers proxiable array literals", () => {
    expect(isProxiable([])).toBe(true)
  })

  it("considers proxiable user-defined array types", () => {
    expect(isProxiable(new Users())).toBe(true)
  })

  it("considers proxiable user-defined types annotated with the @Proxiable() decorator", () => {
    expect(isProxiable(new User())).toBe(true)
  })

  it("considers proxiable user-defined types implementing the 'ArborProxiable' prop", () => {
    expect(isProxiable(new ProxiableType())).toBe(true)
  })

  it("does not consider proxiable user-defined types missing the 'ArborProxiable' prop", () => {
    expect(isProxiable(new NotProxiable())).toBe(false)
  })

  it("does not consider primitive types isProxiable", () => {
    expect(isProxiable(1)).toBe(false)
    expect(isProxiable("Some string")).toBe(false)
    expect(isProxiable(true)).toBe(false)
    expect(isProxiable(false)).toBe(false)
    expect(isProxiable(new String("another string"))).toBe(false)
    expect(isProxiable(new Number(2))).toBe(false)
    expect(isProxiable(new Boolean(true))).toBe(false)
    expect(isProxiable(new Boolean(false))).toBe(false)
  })
})
