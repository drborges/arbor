/* eslint-disable max-classes-per-file */
import clone from "./clone"

class Address {
  constructor(public street: string) {}
}

class User {
  constructor(public name: string, public address?: Address) {}
}

class Users extends Array<User> {}

describe("clone", () => {
  it("clones a literal object applying structural sharing", () => {
    const user = {
      name: "Bob",
      address: { street: "Wallnut St." },
      doSomething() {},
    }

    const clonedUser = clone(user)

    expect(clonedUser).not.toBe(user)
    expect(clonedUser.name).toBe("Bob")
    expect(clonedUser.address).toBe(user.address)
    expect(clonedUser.doSomething).toBe(user.doSomething)
  })

  it("clones a literal array applying structural sharing", () => {
    const users = [{ name: "Bob", address: { street: "Wallnut St." } }]
    const clonedUsers = clone(users)

    expect(clonedUsers).toBeInstanceOf(Array)
    expect(clonedUsers[0]).toBe(users[0])
    expect(clonedUsers[0].address).toBe(users[0].address)
    expect(clonedUsers).toEqual([
      {
        name: "Bob",
        address: { street: "Wallnut St." },
      },
    ])
  })

  it("clones an object applying structural sharing and preservig its prototype", () => {
    const user = new User("Bob", new Address("Wallnut"))
    const clonedUser = clone(user)

    expect(clonedUser).toBeInstanceOf(User)
    expect(clonedUser.address).toBe(user.address)
    expect(clonedUser).toEqual(new User("Bob", new Address("Wallnut")))
  })

  it("clones an array applying structural sharing and preservig its prototype", () => {
    const users = new Users(new User("Bob"), new User("Alice"))
    const clonedUsers = clone(users)

    expect(clonedUsers).toBeInstanceOf(Users)
    expect(clonedUsers[0]).toBe(users[0])
    expect(clonedUsers[1]).toBe(users[1])
    expect(clonedUsers).toEqual(new Users(new User("Bob"), new User("Alice")))
  })

  it("returns performs a no-op if given value is not clonnable", () => {
    expect(clone(null)).toBe(null)
    expect(clone(undefined)).toBe(undefined)
    expect(clone(2 as any)).toBe(2 as any)
    expect(clone("Some string" as any)).toBe("Some string" as any)
  })
})
