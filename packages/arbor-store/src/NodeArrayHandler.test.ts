import Path from "./Path"
import Arbor, { INode } from "./Arbor"
import { StaleNodeError } from "./errors"
import { snapshot, unwrap, warmup } from "./test.helpers"
import NodeArrayHandler from "./NodeArrayHandler"

interface Address {
  street: string
}

interface User {
  name: string
  address: Address
}

describe("NodeArrayHandler", () => {
  it("holds wraps array values", () => {
    const state = [{ name: "User 1", address: { street: "Street 1" } }]
    const tree = new Arbor<User[]>(state)
    const node = new Proxy(
      state,
      new NodeArrayHandler(tree, Path.root, state) as ProxyHandler<User[]>
    )

    expect(node).toBeInstanceOf(Array)
  })

  describe("#$clone", () => {
    it("returns a shallow copy of the node", () => {
      const state = [{ name: "User 1", address: { street: "Street 1" } }]
      const tree = new Arbor<User[]>(state)
      const node = new Proxy(
        state,
        new NodeArrayHandler(tree, Path.root, state) as ProxyHandler<User[]>
      ) as INode<User[]>

      warmup(node[0].address)

      const copy = node.$clone()

      expect(node).not.toBe(copy)
      expect(node[0]).toBe(copy[0])
      expect(node[0].address).toBe(copy[0].address)
    })

    it("shares the same children's cache between original node and copy", () => {
      const state = [{ name: "User 1", address: { street: "Street 1" } }]
      const tree = new Arbor<User[]>(state)
      const node = new Proxy(
        state,
        new NodeArrayHandler(tree, Path.root, state) as ProxyHandler<User[]>
      ) as INode<User[]>

      const copy = node.$clone()

      expect(node).not.toBe(copy)
      expect(node[0]).toBe(copy[0])
      expect(node[0].address).toBe(copy[0].address)
    })

    it("allows users to extend the Array class", () => {
      class Users extends Array<User> {
        get first(): User {
          return this[0]
        }

        get last(): User {
          return this[this.length - 1]
        }

        $clone(): Users {
          return new Users(...this)
        }
      }

      const state = Users.from<Partial<User>>([
        { name: "Bob" },
        { name: "Alice" },
      ]) as Users

      const tree = new Arbor<Users>(state)
      const originalRoot = tree.state
      const originalBob = tree.state[0]
      const originalAlice = tree.state[1]
      const first = tree.state.first as INode<User>
      const last = tree.state.last as INode<User>

      expect(originalRoot).toBeInstanceOf(Users)
      expect(first.$unwrap()).toBe(state[0])
      expect(last.$unwrap()).toBe(state[1])

      tree.state[0].name = "Bob Updated"

      expect(originalBob).toBe(first)
      expect(originalAlice).toBe(last)
      expect(tree.state).toBeInstanceOf(Users)
      expect(tree.state).not.toBe(originalRoot)
      expect(tree.state[0]).not.toBe(originalBob)
      expect(tree.state[1]).toBe(originalAlice)
      expect(tree.state[0]).toEqual({ name: "Bob Updated" })
    })
  })

  describe("delete trap", () => {
    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state

      delete tree.state[0]

      expect(state).toEqual([
        { name: "User 2", address: { street: "Street 2" } },
      ])

      expect(root).toEqual([
        { name: "User 2", address: { street: "Street 2" } },
      ])

      expect(tree.state).toEqual([
        { name: "User 2", address: { street: "Street 2" } },
      ])
    })

    it("invalidates node's children cache", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state as INode<User[]>
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      delete tree.state[1]

      expect(root.$children.has(user1.$unwrap())).toBe(false)
      expect(root.$children.has(user2.$unwrap())).toBe(false)
      expect(root.$children.has(user3.$unwrap())).toBe(false)
    })

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ]
      const previousState = snapshot(state)
      const tree = new Arbor<User[]>(state)

      tree.subscribe(subscriber)

      delete tree.state[1]

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.state, previous: previousState },
        mutationPath: Path.parse("/"),
        metadata: {
          operation: "delete",
          props: ["1"],
        },
      })
    })

    it("ignores mutations on stale array node", () => {
      const store = new Arbor({
        users1: [
          { name: "Alice" }
        ],
        users2: [
          { name: "Bob" }
        ]
      })

      const users1 = store.state.users1
      const users2 = store.state.users2

      store.state.users1 = users2

      expect(store.state.users1).toEqual(users2)

      expect(() => { delete users1[0] }).toThrowError(StaleNodeError)

      expect(store.state.users1).toEqual(users2)
    })
  })

  describe("#splice", () => {
    it("ignores mutations on stale array node", () => {
      const store = new Arbor({
        users1: [
          { name: "Alice" }
        ],
        users2: [
          { name: "Bob" }
        ]
      })

      const users1 = store.state.users1
      const users2 = store.state.users2

      store.state.users1 = users2

      expect(store.state.users1).toEqual(users2)
      expect(() => { users1.splice(0, 1) }).toThrowError(StaleNodeError)
      expect(store.state.users1).toEqual(users2)
    })

    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state

      tree.state.splice(1, 2, {
        name: "User 4",
        address: { street: "Street 4" },
      })

      expect(state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 4", address: { street: "Street 4" } },
      ])

      expect(root).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 4", address: { street: "Street 4" } },
      ])

      expect(tree.state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 4", address: { street: "Street 4" } },
      ])
    })

    it("invalidates node's children cache", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state as INode<User[]>
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.state.splice(1, 2, {
        name: "User 4",
        address: { street: "Street 4" },
      })

      expect(root.$children.has(user1.$unwrap())).toBe(false)
      expect(root.$children.has(user2.$unwrap())).toBe(false)
      expect(root.$children.has(user3.$unwrap())).toBe(false)
    })

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 2" } },
      ]
      const previousState = snapshot(state)
      const tree = new Arbor<User[]>(state)

      tree.subscribe(subscriber)

      tree.state.splice(1, 2, {
        name: "User 4",
        address: { street: "Street 4" },
      })

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.state, previous: previousState },
        mutationPath: Path.parse("/"),
        metadata: {
          operation: "splice",
          props: ["1", "2"],
        },
      })
    })
  })

  describe("#push", () => {
    it("ignores mutations on stale array node", () => {
      const store = new Arbor({
        users1: [
          { name: "Alice" }
        ],
        users2: [
          { name: "Bob" }
        ]
      })

      const users1 = store.state.users1
      const users2 = store.state.users2

      store.state.users1 = users2

      expect(store.state.users1).toEqual(users2)
      expect(() => { users1.push({ name: "Carol" }) }).toThrowError(StaleNodeError)
      expect(store.state.users1).toEqual(users2)
    })

    it("applies structural sharing in order to compute the next state tree", () => {
      const state = [{ name: "User 1", address: { street: "Street 1" } }]

      const tree = new Arbor<User[]>(state)
      const root = tree.state
      const user1 = warmup(root[0])

      tree.state.push({
        name: "User 2",
        address: { street: "Street 2" },
      })

      expect(tree.state).not.toBe(root)
      expect(tree.state[0]).toBe(user1)
      expect(tree.state[0].address).toBe(user1.address)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = [{ name: "User 1", address: { street: "Street 1" } }]

      const tree = new Arbor<User[]>(state)

      tree.state.push({
        name: "User 2",
        address: { street: "Street 2" },
      })

      expect(unwrap(tree.state)).not.toBe(state)
      expect(unwrap(tree.state[0])).toBe(state[0])
      expect(unwrap(tree.state[0].address)).toBe(state[0].address)
    })

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = [{ name: "User 1", address: { street: "Street 1" } }]
      const previousState = snapshot(state)
      const tree = new Arbor<User[]>(state)

      tree.subscribe(subscriber)

      tree.state.push({ name: "User 2", address: { street: "Street 2" } })

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.state, previous: previousState },
        mutationPath: Path.parse("/"),
        metadata: {
          operation: "push",
          props: ["1"],
        },
      })
    })
  })

  describe("#reverse", () => {
    it("ignores mutations on stale array node", () => {
      const store = new Arbor({
        users1: [
          { name: "Alice" }
        ],
        users2: [
          { name: "Carol" },
          { name: "Bob" }
        ]
      })

      const users1 = store.state.users1
      const users2 = store.state.users2

      store.state.users1 = users2

      expect(store.state.users1).toEqual(users2)
      expect(() => { users1.reverse() }).toThrowError(StaleNodeError)
      expect(store.state.users1).toEqual(users2)
    })

    it("invalidates node's children cache", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state as INode<User[]>
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.state.reverse()

      expect(root.$children.has(user1.$unwrap())).toBe(false)
      expect(root.$children.has(user2.$unwrap())).toBe(false)
      expect(root.$children.has(user3.$unwrap())).toBe(false)
    })

    it("keeps node paths up-to-date", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)

      warmup(tree.state[0].address)
      warmup(tree.state[1].address)
      warmup(tree.state[2].address)

      tree.state.reverse()

      const user1 = warmup(tree.state[0])
      const user2 = warmup(tree.state[1])
      const user3 = warmup(tree.state[2])

      const user1Address = warmup(tree.state[0].address)
      const user2Address = warmup(tree.state[1].address)
      const user3Address = warmup(tree.state[2].address)

      expect(user1.$path.toString()).toEqual("/0")
      expect(user1Address.$path.toString()).toEqual("/0/address")
      expect(user2.$path.toString()).toEqual("/1")
      expect(user2Address.$path.toString()).toEqual("/1/address")
      expect(user3.$path.toString()).toEqual("/2")
      expect(user3Address.$path.toString()).toEqual("/2/address")
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state
      const user0 = tree.state[0]
      const user1 = tree.state[1]
      const user2 = tree.state[2]

      tree.state.reverse()

      expect(unwrap(tree.state)).not.toBe(root)
      expect(unwrap(tree.state[0])).toBe(unwrap(user2))
      expect(unwrap(tree.state[0].address)).toBe(unwrap(user2.address))
      expect(unwrap(tree.state[1])).toBe(unwrap(user1))
      expect(unwrap(tree.state[1].address)).toBe(unwrap(user1.address))
      expect(unwrap(tree.state[2])).toBe(unwrap(user0))
      expect(unwrap(tree.state[2].address)).toBe(unwrap(user0.address))
    })

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ]
      const previousState = snapshot(state)
      const tree = new Arbor<User[]>(state)

      tree.subscribe(subscriber)

      tree.state.reverse()

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.state, previous: previousState },
        mutationPath: Path.parse("/"),
        metadata: {
          operation: "reverse",
          props: [],
        },
      })
    })
  })

  describe("#pop", () => {
    it("ignores mutations on stale array node", () => {
      const store = new Arbor({
        users1: [
          { name: "Alice" }
        ],
        users2: [
          { name: "Bob" }
        ]
      })

      const users1 = store.state.users1
      const users2 = store.state.users2

      store.state.users1 = users2

      expect(store.state.users1).toEqual(users2)
      expect(() => { users1.pop() }).toThrowError(StaleNodeError)
      expect(store.state.users1).toEqual(users2)
    })

    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state
      const user2 = root[2]

      const popped = tree.state.pop()

      expect(popped).toBe(unwrap(user2))

      expect(state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ])

      expect(root).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ])

      expect(tree.state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ])
    })

    it("remove popped node from parent's cache", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state as INode<User[]>
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.state.pop()

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(false)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)

      tree.state.pop()

      expect(unwrap(tree.state)).not.toBe(state)
      expect(unwrap(tree.state[0])).toBe(state[0])
      expect(unwrap(tree.state[0].address)).toBe(state[0].address)
      expect(unwrap(tree.state[1])).toBe(state[1])
      expect(unwrap(tree.state[1].address)).toBe(state[1].address)
    })

    it("applies structural sharing in order to compute the next state tree", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state
      const user1 = root[0]
      const user2 = root[1]

      tree.state.pop()

      expect(tree.state).not.toBe(root)
      expect(tree.state[0]).toBe(user1)
      expect(tree.state[1]).toBe(user2)
    })

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ]
      const previousState = snapshot(state)
      const tree = new Arbor<User[]>(state)

      tree.subscribe(subscriber)

      tree.state.pop()

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.state, previous: previousState },
        mutationPath: Path.parse("/"),
        metadata: {
          operation: "pop",
          props: ["1"],
        },
      })
    })
  })

  describe("#shift", () => {
    it("ignores mutations on stale array node", () => {
      const store = new Arbor({
        users1: [
          { name: "Alice" }
        ],
        users2: [
          { name: "Bob" }
        ]
      })

      const users1 = store.state.users1
      const users2 = store.state.users2

      store.state.users1 = users2

      expect(store.state.users1).toEqual(users2)
      expect(() => { users1.shift() }).toThrowError(StaleNodeError)
      expect(store.state.users1).toEqual(users2)
    })

    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state
      const user0 = state[0]

      const shifted = tree.state.shift()

      expect(shifted).toBe(user0)

      expect(state).toEqual([
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(root).toEqual([
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(tree.state).toEqual([
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])
    })

    it("invalidates node's children cache", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state as INode<User[]>
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.state.shift()

      expect(root.$children.has(user1.$unwrap())).toBe(false)
      expect(root.$children.has(user2.$unwrap())).toBe(false)
      expect(root.$children.has(user3.$unwrap())).toBe(false)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const user1 = state[1]
      const user2 = state[2]

      tree.state.shift()

      expect(unwrap(tree.state)).not.toBe(state)
      expect(unwrap(tree.state[0])).toBe(user1)
      expect(unwrap(tree.state[0].address)).toBe(user1.address)
      expect(unwrap(tree.state[1])).toBe(user2)
      expect(unwrap(tree.state[1].address)).toBe(user2.address)
    })

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ]

      const previousState = snapshot(state)

      const tree = new Arbor<User[]>(state)

      tree.subscribe(subscriber)

      tree.state.shift()

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.state, previous: previousState },
        mutationPath: Path.parse("/"),
        metadata: {
          operation: "shift",
          props: [],
        },
      })
    })
  })

  describe("#sort", () => {
    it("ignores mutations on stale array node", () => {
      const store = new Arbor({
        users1: [
          { name: "Carol" },
          { name: "Alice" },
        ],
        users2: [
          { name: "Carol" },
          { name: "Bob" },
        ]
      })

      const users1 = store.state.users1
      const users2 = store.state.users2

      store.state.users1 = users2

      expect(store.state.users1).toEqual(users2)
      expect(() => { users1.sort((a, b) => a.name.localeCompare(b.name)) }).toThrowError(StaleNodeError)
      expect(store.state.users1).toEqual(users2)
    })

    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
        { name: "User 1", address: { street: "Street 1" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state

      const sorted = tree.state.sort((user1: User, user2: User) =>
        user1.name.localeCompare(user2.name)
      )

      expect(sorted).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(root).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(tree.state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])
    })

    it("invalidates node's children cache", () => {
      const state = [
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
        { name: "User 1", address: { street: "Street 1" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.state as INode<User[]>
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.state.sort((userA: User, userB: User) =>
        userA.name.localeCompare(userB.name)
      )

      expect(root.$children.has(user1.$unwrap())).toBe(false)
      expect(root.$children.has(user2.$unwrap())).toBe(false)
      expect(root.$children.has(user3.$unwrap())).toBe(false)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = [
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
        { name: "User 1", address: { street: "Street 1" } },
      ]

      const tree = new Arbor<User[]>(state)
      const user0 = state[0]
      const user1 = state[1]
      const user2 = state[2]

      tree.state.sort((userA: User, userB: User) =>
        userA.name.localeCompare(userB.name)
      )

      expect(unwrap(tree.state)).not.toBe(state)
      expect(unwrap(tree.state[0])).toBe(user2)
      expect(unwrap(tree.state[0].address)).toBe(user2.address)
      expect(unwrap(tree.state[1])).toBe(user0)
      expect(unwrap(tree.state[1].address)).toBe(user0.address)
      expect(unwrap(tree.state[2])).toBe(user1)
      expect(unwrap(tree.state[2].address)).toBe(user1.address)
    })

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ]

      const tree = new Arbor<User[]>(state)

      tree.subscribe(subscriber)

      tree.state.sort()

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.state, previous: state },
        mutationPath: Path.parse("/"),
        metadata: {
          operation: "sort",
          props: [],
        },
      })
    })
  })

  describe("#unshift", () => {
    it("ignores mutations on stale array node", () => {
      const store = new Arbor({
        users1: [
          { name: "Alice" },
        ],
        users2: [
          { name: "Bob" },
        ]
      })

      const users1 = store.state.users1
      const users2 = store.state.users2

      store.state.users1 = users2

      expect(store.state.users1).toEqual(users2)
      expect(() => { users1.unshift({ name: "Carol" }) }).toThrowError(StaleNodeError)
      expect(store.state.users1).toEqual(users2)
    })

    it("generates a new state tree root node", () => {
      const state = [{ name: "User 3", address: { street: "Street 3" } }]

      const tree = new Arbor<User[]>(state)
      const root = tree.state

      const newLength = tree.state.unshift(
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } }
      )

      expect(newLength).toBe(3)

      expect(state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(root).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(tree.state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])
    })

    it("invalidates node's children cache", () => {
      const state = [{ name: "User 3", address: { street: "Street 3" } }]

      const tree = new Arbor<User[]>(state)
      const root = tree.state as INode<User[]>
      const user1 = warmup(root[0])

      expect(root.$children.has(user1.$unwrap())).toBe(true)

      tree.state.unshift(
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } }
      )

      expect(root.$children.has(user1.$unwrap())).toBe(false)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = [{ name: "User 3", address: { street: "Street 3" } }]

      const tree = new Arbor<User[]>(state)
      const user0 = state[0]

      tree.state.unshift(
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } }
      )

      expect(unwrap(tree.state)).not.toBe(state)
      expect(unwrap(tree.state[2])).toBe(user0)
      expect(unwrap(tree.state[2].address)).toBe(user0.address)
    })

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ]
      const previousState = snapshot(state)

      const tree = new Arbor<User[]>(state)

      tree.subscribe(subscriber)

      tree.state.unshift(
        { name: "User 3", address: { street: "Street 1" } },
        { name: "User 4", address: { street: "Street 2" } }
      )

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.state, previous: previousState },
        mutationPath: Path.parse("/"),
        metadata: {
          operation: "unshift",
          props: ["0", "1"],
        },
      })
    })
  })
})
