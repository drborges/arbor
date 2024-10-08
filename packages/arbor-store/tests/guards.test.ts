/* eslint-disable max-classes-per-file */
/* eslint-disable no-new-wrappers */
import { describe, expect, it } from "vitest"

import { Arbor } from "../src/arbor"
import { ArborProxiable, proxiable } from "../src/decorators"
import { isNode, isProxiable } from "../src/guards"

@proxiable
class User {}
class NotProxiable {}
class Users extends Array {}
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

  it("considers proxiable user-defined types annotated with the @proxiable decorator", () => {
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

describe("isNode", () => {
  it("checks whether or not a given value is an Arbor Node", () => {
    expect(isNode(null)).toEqual(false)
    expect(isNode(undefined)).toEqual(false)
    expect(isNode({})).toEqual(false)
    expect(isNode({ $tree: "not an Arbor instance" })).toEqual(false)
    expect(
      isNode({
        get $tree() {
          return new Arbor({})
        },
      })
    ).toEqual(true)
  })
})
