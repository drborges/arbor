/* eslint-disable max-classes-per-file */
/* eslint-disable no-new-wrappers */
import BaseNode from "./BaseNode"
import { Clonable } from "./isClonable"
import proxiable, { ArborProxiable } from "./proxiable"

class NotProxiable {}
class Proxiable {
  get [ArborProxiable]() {
    return true
  }
}

class Users extends Array {}
class User extends BaseNode<User> {}
class UserSet extends Set<User> implements Clonable<UserSet> {
  $clone(): UserSet {
    return new UserSet(this.values())
  }
}

describe("proxiable", () => {
  it("considers proxiable object literals", () => {
    expect(proxiable({})).toBe(true)
  })

  it("considers proxiable array literals", () => {
    expect(proxiable([])).toBe(true)
  })

  it("considers proxiable user-defined array types", () => {
    expect(proxiable(new Users())).toBe(true)
  })

  it("considers proxiable user-defined types extending from BaseNode", () => {
    expect(proxiable(new User())).toBe(true)
  })

  it("considers proxiable user-defined types implementing the Clonable interface", () => {
    expect(proxiable(new UserSet())).toBe(true)
  })

  it("considers proxiable user-defined types implementing the 'ArborProxiable' prop", () => {
    expect(proxiable(new Proxiable())).toBe(true)
  })

  it("does not consider proxiable user-defined types missing the 'ArborProxiable' prop", () => {
    expect(proxiable(new NotProxiable())).toBe(false)
  })

  it("does not consider primitive types proxiable", () => {
    expect(proxiable(1)).toBe(false)
    expect(proxiable("Some string")).toBe(false)
    expect(proxiable(true)).toBe(false)
    expect(proxiable(false)).toBe(false)
    expect(proxiable(new String("another string"))).toBe(false)
    expect(proxiable(new Number(2))).toBe(false)
    expect(proxiable(new Boolean(true))).toBe(false)
    expect(proxiable(new Boolean(false))).toBe(false)
  })
})
