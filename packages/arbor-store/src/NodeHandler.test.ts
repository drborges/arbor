import { Path } from "."
import Arbor from "./Arbor"
import NodeCache from "./NodeCache"
import NodeHandler from "./NodeHandler"
import { children, unwrap, warmup } from "./test.helpers"
import { MutationMode, Node } from "./types"

interface Address {
  street: string
}

interface User {
  name: string
  address: Address
}

interface State {
  users: User[]
}

describe("NodeHandler", () => {
  describe("get trap", () => {
    it("keeps cached nodes within their parent's cache", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)

      const node = new Proxy(
        state,
        new NodeHandler<State>(tree, Path.root, state) as ProxyHandler<State>
      ) as Node<State>

      warmup(node.users[0])
      warmup(node.users[1])

      expect(node.users).toBe(children(node).get(state.users))
      expect(node.users[0]).toBe(children(node.users).get(state.users[0]))
      expect(node.users[1]).toBe(children(node.users).get(state.users[1]))
    })

    it("returns the same node reference for cached nodes", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)

      const node = new Proxy(
        state,
        new NodeHandler<State>(
          tree,
          Path.root,
          state,
          new NodeCache()
        ) as ProxyHandler<State>
      ) as Node<State>

      expect(node.users).toBe(node.users)
      expect(node.users[0]).toBe(node.users[0])
      expect(node.users[1]).toBe(node.users[1])
    })

    it("binds function properties to the proxy itseld", () => {
      const tree = new Arbor({
        id: 1,
        text: "Clean the house",
        completed: false,
        complete() {
          this.completed = true
        },
      })

      const complete = tree.root.complete
      // function props are automatically bound to the proxy instance
      complete()

      expect(tree.root.completed).toBe(true)
    })
  })

  describe("set trap", () => {
    it("does not affect underlying proxied data", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)

      tree.root.users[0].name = "User 1 Updated"

      expect(state.users[0].name).toEqual("User 1")
    })

    it("generates a new state tree root node", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)
      const root = tree.root

      tree.root.users[0].name = "User 1 Updated"

      expect(state).toEqual({
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      })

      expect(root).toEqual({
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      })

      expect(tree.root).toEqual({
        users: [
          { name: "User 1 Updated", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      })
    })

    it("applies structural sharing in order to compute the next state tree", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)
      const root = tree.root
      const users = root.users
      const user1 = users[0]
      const user1Address = users[0].address
      const user2 = users[1]
      const user2Address = users[1].address

      tree.root.users[0].name = "User 1 Updated"

      expect(root).not.toBe(tree.root)
      expect(users).not.toBe(tree.root.users)
      expect(user1).not.toBe(tree.root.users[0])
      expect(user1Address).toBe(tree.root.users[0].address)
      expect(user2).toBe(tree.root.users[1])
      expect(user2Address).toBe(tree.root.users[1].address)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)

      tree.root.users[0].name = "User 1 Updated"

      expect(tree.root.$unwrap()).not.toBe(state)
      expect(unwrap(tree.root.users)).not.toBe(state.users)
      expect(unwrap(tree.root.users[0])).not.toBe(state.users[0])
      expect(unwrap(tree.root.users[0].address)).toBe(state.users[0].address)
      expect(unwrap(tree.root.users[1])).toBe(state.users[1])
      expect(unwrap(tree.root.users[1].address)).toBe(state.users[1].address)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = {
          users: [
            { name: "User 1", address: { street: "Street 1" } },
            { name: "User 2", address: { street: "Street 2" } },
          ],
        }

        const tree = new Arbor(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        tree.root.users[0].name = "User 1 Updated"

        expect(state).toEqual({
          users: [
            { name: "User 1 Updated", address: { street: "Street 1" } },
            { name: "User 2", address: { street: "Street 2" } },
          ],
        })

        expect(root).toEqual({
          users: [
            { name: "User 1 Updated", address: { street: "Street 1" } },
            { name: "User 2", address: { street: "Street 2" } },
          ],
        })

        expect(tree.root).toEqual({
          users: [
            { name: "User 1 Updated", address: { street: "Street 1" } },
            { name: "User 2", address: { street: "Street 2" } },
          ],
        })
      })
    })
  })

  describe("delete trap", () => {
    it("generates a new state tree root node", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)
      const root = tree.root

      delete tree.root.users[0].address

      expect(state).toEqual({
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      })

      expect(root).toEqual({
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      })

      expect(tree.root).toEqual({
        users: [
          { name: "User 1" },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      })
    })

    it("applies structural sharing in order to compute the next state tree", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)
      const root = tree.root
      const users = root.users
      const user1 = users[0]
      const user2 = users[1]

      delete tree.root.users[0].address

      expect(root).not.toBe(tree.root)
      expect(users).not.toBe(tree.root.users)
      expect(user1).not.toBe(tree.root.users[0])
      expect(user2).toBe(tree.root.users[1])
      expect(user2.address).toBe(tree.root.users[1].address)
    })

    it("preserves underlying object reference of nodes not affected by the mutation path", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)

      delete tree.root.users[0].address

      expect(unwrap(tree.root)).not.toBe(state)
      expect(unwrap(tree.root.users)).not.toBe(state.users)
      expect(unwrap(tree.root.users[0])).not.toBe(state.users[0])
      expect(unwrap(tree.root.users[1])).toBe(state.users[1])
      expect(unwrap(tree.root.users[1].address)).toBe(state.users[1].address)
    })

    it("removes child node from parent's cache", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor<State>(state)

      warmup(tree.root.users[0].address)

      delete tree.root.users[0].address
      const nodeChildren = children(tree.root.users[0])

      expect(nodeChildren.has(state.users[0].address)).toBe(false)
    })

    describe("mode = 'forgiven'", () => {
      it("propates mutation side-effects to the original node's underlying value", () => {
        const state = {
          users: [
            { name: "User 1", address: { street: "Street 1" } },
            { name: "User 2", address: { street: "Street 2" } },
          ],
        }

        const tree = new Arbor(state, { mode: MutationMode.FORGIVEN })
        const root = tree.root

        delete tree.root.users[0].address

        expect(state).toEqual({
          users: [
            { name: "User 1" },
            { name: "User 2", address: { street: "Street 2" } },
          ],
        })

        expect(root).toEqual({
          users: [
            { name: "User 1" },
            { name: "User 2", address: { street: "Street 2" } },
          ],
        })

        expect(tree.root).toEqual({
          users: [
            { name: "User 1" },
            { name: "User 2", address: { street: "Street 2" } },
          ],
        })
      })
    })
  })

  describe("#$unwrap", () => {
    it("returns the underlying proxied value", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)

      const node = new Proxy(
        state,
        new NodeHandler<State>(tree, Path.root, state) as ProxyHandler<State>
      ) as Node<State>

      expect(node.$unwrap()).toBe(state)
      expect((node.users as Node<User[]>).$unwrap()).toBe(state.users)
      expect((node.users[0] as Node<User>).$unwrap()).toBe(state.users[0])
      expect((node.users[1] as Node<User>).$unwrap()).toBe(state.users[1])
    })
  })

  describe("#$path", () => {
    it("keeps track of the node's path within the state tree", () => {
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor(state)

      const node = new Proxy(
        state,
        new NodeHandler<State>(tree, Path.root, state) as ProxyHandler<State>
      ) as Node<State>

      expect(node.$path.toString()).toEqual("/")
      expect((node.users as Node<User[]>).$path.toString()).toEqual("/users")
      expect((node.users[0] as Node<User>).$path.toString()).toEqual("/users/0")
      expect((node.users[1] as Node<User>).$path.toString()).toEqual("/users/1")
    })
  })

  describe("#$clone", () => {
    it("returns a shallow copy of the node", () => {
      const state = {
        users: [{ name: "User 1", address: { street: "Street 1" } }],
      }

      const tree = new Arbor(state)
      const node = new Proxy(
        state,
        new NodeHandler<State>(tree, Path.root, state) as ProxyHandler<State>
      ) as Node<State>

      warmup(node.users[0])

      const copy = node.$clone()

      expect(node).not.toBe(copy)
      expect(node.users).toBe(copy.users)
      expect(node.users[0]).toBe(copy.users[0])
      expect(node.users[0].address).toBe(copy.users[0].address)
    })

    it("shares the same children's cache between original node and copy", () => {
      const state = {
        users: [{ name: "User 1", address: { street: "Street 1" } }],
      }

      const tree = new Arbor(state)
      const node = new Proxy(
        state,
        new NodeHandler<State>(tree, Path.root, state) as ProxyHandler<State>
      ) as Node<State>

      const copy = node.$clone()

      expect(node).not.toBe(copy)
      expect(node.users).toBe(copy.users)
      expect(node.users[0]).toBe(copy.users[0])
      expect(node.users[0].address).toBe(copy.users[0].address)
    })
  })
})
