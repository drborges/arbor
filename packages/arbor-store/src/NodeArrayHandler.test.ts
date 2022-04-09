import Path from "./Path"
import { unwrap, warmup } from "./test.helpers"
import NodeArrayHandler from "./NodeArrayHandler"
import Arbor, { MutationMode, Node } from "./Arbor"

interface Address {
  street: string
}

interface User {
  name: string
  address: Address
}

describe("NodeArrayHandler", () => {
  it("holds wraps array valus", () => {
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
      ) as Node<User[]>

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
        new NodeArrayHandler<User>(tree, Path.root, state) as ProxyHandler<
          User[]
        >
      ) as Node<User[]>

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
      const originalRoot = tree.root
      const originalBob = tree.root[0]
      const originalAlice = tree.root[1]
      const first = tree.root.first
      const last = tree.root.last

      expect(originalRoot).toBeInstanceOf(Users)
      expect(first.$unwrap()).toBe(state[0])
      expect(last.$unwrap()).toBe(state[1])

      tree.root[0].name = "Bob Updated"

      expect(originalBob).toBe(first)
      expect(originalAlice).toBe(last)
      expect(tree.root).toBeInstanceOf(Users)
      expect(tree.root).not.toBe(originalRoot)
      expect(tree.root[0]).not.toBe(originalBob)
      expect(tree.root[1]).toBe(originalAlice)
      expect(tree.root[0]).toEqual({ name: "Bob Updated" })
    })
  })

  describe("delete trap", () => {
    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.root

      delete tree.root[0]

      expect(state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ])

      expect(root).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ])

      expect(tree.root).toEqual([
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
      const root = tree.root
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      delete tree.root[1]

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

      delete tree.root[1]

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root[0])).toBe(state[0])
      expect(unwrap(tree.root[0].address)).toBe(state[0].address)

      expect(unwrap(tree.root[1])).not.toBe(state[1])
      expect(unwrap(tree.root[1])).toBe(state[2])
      expect(unwrap(tree.root[1].address)).toBe(state[2].address)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ]

        const tree = new Arbor<User[]>(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        delete tree.root[0]

        expect(state).toEqual([
          { name: "User 2", address: { street: "Street 2" } },
        ])

        expect(root).toEqual([
          { name: "User 2", address: { street: "Street 2" } },
        ])

        expect(tree.root).toEqual([
          { name: "User 2", address: { street: "Street 2" } },
        ])
      })
    })
  })

  describe("#splice", () => {
    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.root

      tree.root.splice(1, 2, {
        name: "User 4",
        address: { street: "Street 4" },
      })

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

      expect(tree.root).toEqual([
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
      const root = tree.root
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.root.splice(1, 2, {
        name: "User 4",
        address: { street: "Street 4" },
      })

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

      tree.root.splice(1, 2, {
        name: "User 4",
        address: { street: "Street 4" },
      })

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root[0])).toBe(state[0])
      expect(unwrap(tree.root[0].address)).toBe(state[0].address)

      expect(unwrap(tree.root[1])).not.toBe(state[1])
      expect(unwrap(tree.root[1])).not.toBe(state[2])
      expect(unwrap(tree.root[1].address)).not.toBe(state[1].address)
      expect(unwrap(tree.root[1].address)).not.toBe(state[2].address)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ]

        const tree = new Arbor<User[]>(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        tree.root.splice(1, 2, {
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

        expect(tree.root).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 4", address: { street: "Street 4" } },
        ])
      })
    })
  })

  describe("#push", () => {
    it("generates a new state tree root node", () => {
      const state = [{ name: "User 1", address: { street: "Street 1" } }]

      const tree = new Arbor<User[]>(state)
      const root = tree.root

      tree.root.push({
        name: "User 2",
        address: { street: "Street 2" },
      })

      expect(state).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
      ])

      expect(root).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
      ])

      expect(tree.root).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
      ])
    })

    it("applies structural sharing in order to compute the next state tree", () => {
      const state = [{ name: "User 1", address: { street: "Street 1" } }]

      const tree = new Arbor<User[]>(state)
      const root = tree.root
      const user1 = warmup(root[0])

      tree.root.push({
        name: "User 2",
        address: { street: "Street 2" },
      })

      expect(tree.root).not.toBe(root)
      expect(tree.root[0]).toBe(user1)
      expect(tree.root[0].address).toBe(user1.address)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = [{ name: "User 1", address: { street: "Street 1" } }]

      const tree = new Arbor<User[]>(state)

      tree.root.push({
        name: "User 2",
        address: { street: "Street 2" },
      })

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root[0])).toBe(state[0])
      expect(unwrap(tree.root[0].address)).toBe(state[0].address)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = [{ name: "User 1", address: { street: "Street 1" } }]

        const tree = new Arbor<User[]>(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        tree.root.push({
          name: "User 2",
          address: { street: "Street 2" },
        })

        expect(state).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ])

        expect(root).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ])

        expect(tree.root).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ])
      })
    })
  })

  describe("#reverse", () => {
    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.root

      const reversed = tree.root.reverse()

      expect(reversed).toEqual([
        { name: "User 3", address: { street: "Street 3" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 1", address: { street: "Street 1" } },
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

      expect(tree.root).toEqual([
        { name: "User 3", address: { street: "Street 3" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 1", address: { street: "Street 1" } },
      ])
    })

    it("invalidates node's children cache", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.root
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.root.reverse()

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

      warmup(tree.root[0].address)
      warmup(tree.root[1].address)
      warmup(tree.root[2].address)

      tree.root.reverse()

      const user1 = warmup(tree.root[0])
      const user2 = warmup(tree.root[1])
      const user3 = warmup(tree.root[2])

      const user1Address = warmup(tree.root[0].address)
      const user2Address = warmup(tree.root[1].address)
      const user3Address = warmup(tree.root[2].address)

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

      tree.root.reverse()

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root[0])).toBe(state[2])
      expect(unwrap(tree.root[0].address)).toBe(state[2].address)
      expect(unwrap(tree.root[1])).toBe(state[1])
      expect(unwrap(tree.root[1].address)).toBe(state[1].address)
      expect(unwrap(tree.root[2])).toBe(state[0])
      expect(unwrap(tree.root[2].address)).toBe(state[0].address)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ]

        const tree = new Arbor<User[]>(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        tree.root.reverse()

        expect(state).toEqual([
          { name: "User 3", address: { street: "Street 3" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 1", address: { street: "Street 1" } },
        ])

        expect(root).toEqual([
          { name: "User 3", address: { street: "Street 3" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 1", address: { street: "Street 1" } },
        ])

        expect(tree.root).toEqual([
          { name: "User 3", address: { street: "Street 3" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 1", address: { street: "Street 1" } },
        ])
      })
    })
  })

  describe("#pop", () => {
    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.root

      const popped = tree.root.pop()

      expect(popped).toBe(state[2])

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

      expect(tree.root).toEqual([
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
      const root = tree.root
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.root.pop()

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

      tree.root.pop()

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root[0])).toBe(state[0])
      expect(unwrap(tree.root[0].address)).toBe(state[0].address)
      expect(unwrap(tree.root[1])).toBe(state[1])
      expect(unwrap(tree.root[1].address)).toBe(state[1].address)
    })

    it("applies structural sharing in order to compute the next state tree", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.root
      const user1 = root[0]
      const user2 = root[1]

      tree.root.pop()

      expect(tree.root).not.toBe(root)
      expect(tree.root[0]).toBe(user1)
      expect(tree.root[1]).toBe(user2)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ]

        const tree = new Arbor<User[]>(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        tree.root.pop()

        expect(state).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ])

        expect(root).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ])

        expect(tree.root).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ])
      })
    })
  })

  describe("#shift", () => {
    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.root

      const shifted = tree.root.shift()

      expect(shifted).toBe(state[0])

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

      expect(tree.root).toEqual([
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
      const root = tree.root
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.root.shift()

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

      tree.root.shift()

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root[0])).toBe(state[1])
      expect(unwrap(tree.root[0].address)).toBe(state[1].address)
      expect(unwrap(tree.root[1])).toBe(state[2])
      expect(unwrap(tree.root[1].address)).toBe(state[2].address)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ]

        const tree = new Arbor<User[]>(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        tree.root.shift()

        expect(state).toEqual([
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ])

        expect(root).toEqual([
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ])

        expect(tree.root).toEqual([
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ])
      })
    })
  })

  describe("#sort", () => {
    it("generates a new state tree root node", () => {
      const state = [
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
        { name: "User 1", address: { street: "Street 1" } },
      ]

      const tree = new Arbor<User[]>(state)
      const root = tree.root

      const sorted = tree.root.sort((user1: User, user2: User) =>
        user1.name.localeCompare(user2.name)
      )

      expect(sorted).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(state).toEqual([
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
        { name: "User 1", address: { street: "Street 1" } },
      ])

      expect(root).toEqual([
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
        { name: "User 1", address: { street: "Street 1" } },
      ])

      expect(tree.root).toEqual([
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
      const root = tree.root
      const user1 = warmup(root[0])
      const user2 = warmup(root[1])
      const user3 = warmup(root[2])

      expect(root.$children.has(user1.$unwrap())).toBe(true)
      expect(root.$children.has(user2.$unwrap())).toBe(true)
      expect(root.$children.has(user3.$unwrap())).toBe(true)

      tree.root.sort((userA: User, userB: User) =>
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

      tree.root.sort((userA: User, userB: User) =>
        userA.name.localeCompare(userB.name)
      )

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root[0])).toBe(state[2])
      expect(unwrap(tree.root[0].address)).toBe(state[2].address)
      expect(unwrap(tree.root[1])).toBe(state[0])
      expect(unwrap(tree.root[1].address)).toBe(state[0].address)
      expect(unwrap(tree.root[2])).toBe(state[1])
      expect(unwrap(tree.root[2].address)).toBe(state[1].address)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = [
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
          { name: "User 1", address: { street: "Street 1" } },
        ]

        const tree = new Arbor<User[]>(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        tree.root.sort((userA: User, userB: User) =>
          userA.name.localeCompare(userB.name)
        )

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

        expect(tree.root).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ])
      })
    })
  })

  describe("FOCUS #unshift", () => {
    it("generates a new state tree root node", () => {
      const state = [{ name: "User 3", address: { street: "Street 3" } }]

      const tree = new Arbor<User[]>(state)
      const root = tree.root

      const newLength = tree.root.unshift(
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } }
      )

      expect(newLength).toBe(3)

      expect(state).toEqual([
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(root).toEqual([
        { name: "User 3", address: { street: "Street 3" } },
      ])

      expect(tree.root).toEqual([
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } },
        { name: "User 3", address: { street: "Street 3" } },
      ])
    })

    it("invalidates node's children cache", () => {
      const state = [{ name: "User 3", address: { street: "Street 3" } }]

      const tree = new Arbor<User[]>(state)
      const root = tree.root
      const user1 = warmup(root[0])

      expect(root.$children.has(user1.$unwrap())).toBe(true)

      tree.root.unshift(
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } }
      )

      expect(root.$children.has(user1.$unwrap())).toBe(false)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = [{ name: "User 3", address: { street: "Street 3" } }]

      const tree = new Arbor<User[]>(state)

      tree.root.unshift(
        { name: "User 1", address: { street: "Street 1" } },
        { name: "User 2", address: { street: "Street 2" } }
      )

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root[2])).toBe(state[0])
      expect(unwrap(tree.root[2].address)).toBe(state[0].address)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = [{ name: "User 3", address: { street: "Street 3" } }]

        const tree = new Arbor<User[]>(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        tree.root.unshift(
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } }
        )

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

        expect(tree.root).toEqual([
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
          { name: "User 3", address: { street: "Street 3" } },
        ])
      })
    })
  })
})
