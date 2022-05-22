import Path from "./Path"
import NodeCache from "./NodeCache"
import NodeHandler from "./NodeHandler"
import Arbor, { MutationMode, INode } from "./Arbor"
import { children, toINode, unwrap, warmup } from "./test.helpers"

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
        new NodeHandler(tree, Path.root, state) as ProxyHandler<State>
      ) as INode<State>

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
        new NodeHandler(
          tree,
          Path.root,
          state,
          new NodeCache()
        ) as ProxyHandler<State>
      ) as INode<State>

      expect(node.users).toBe(node.users)
      expect(node.users[0]).toBe(node.users[0])
      expect(node.users[1]).toBe(node.users[1])
    })

    it("binds function properties to the proxy itself", () => {
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

    it("memoizes function properties so that different callers end up with the same function reference", () => {
      const tree = new Arbor({
        id: 1,
        text: "Clean the house",
        completed: false,
        complete() {
          this.completed = true
        },
      })

      expect(tree.root.complete).toBe(tree.root.complete)
    })

    it("allow proxied values to define properties whose names match properties in the ProxyHandler API", () => {
      class Message {
        msg = "Hello World"

        get(): string {
          return this.msg
        }

        set(msg: string) {
          this.msg = msg
        }

        deleteProperty() {
          this.msg = ""
        }
      }

      const tree = new Arbor(new Message())

      expect(tree.root.get()).toBe("Hello World")
      tree.root.set("Hello Arbor")
      expect(tree.root.get()).toBe("Hello Arbor")
      tree.root.deleteProperty()
      expect(tree.root.get()).toBe("")
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

      const root = toINode(tree.root)

      expect(root.$unwrap()).not.toBe(state)
      expect(unwrap(tree.root.users)).not.toBe(state.users)
      expect(unwrap(tree.root.users[0])).not.toBe(state.users[0])
      expect(unwrap(tree.root.users[0].address)).toBe(state.users[0].address)
      expect(unwrap(tree.root.users[1])).toBe(state.users[1])
      expect(unwrap(tree.root.users[1].address)).toBe(state.users[1].address)
    })

    it("handles assignment of state tree nodes", () => {
      const store = new Arbor({
        users: [{ name: "User 1" }, { name: "User 2" }],
      })

      store.root.users[0] = store.root.users[1]

      const node1 = store.root.users[0] as INode<User>
      const node2 = store.root.users[1] as INode<User>

      expect(store.root.users).toEqual([{ name: "User 2" }, { name: "User 2" }])
      expect(node1.$path.toString()).toEqual("/users/0")
      expect(node2.$path.toString()).toEqual("/users/1")
    })

    it("does not notify subscribers when mutations do not change the target's value", () => {
      const subscriber = jest.fn()
      const store = new Arbor({
        users: [{ name: "User 1" }],
      })

      store.subscribe(subscriber)
      store.root.users[0].name = "User 1"

      expect(subscriber).not.toHaveBeenCalled()
    })

    it("does not notify subscribers when the new value is the actual state tree node", () => {
      const subscriber = jest.fn()
      const store = new Arbor({
        users: [{ name: "User 1" }],
      })

      store.subscribe(subscriber)
      const user = store.root.users[0]
      store.root.users[0] = user

      expect(subscriber).not.toHaveBeenCalled()
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

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = {
        users: [{ name: "User 1", address: { street: "Street 1" } }],
      }

      const tree = new Arbor<State>(state)

      tree.subscribe(subscriber)

      tree.root.users[0].name = "User Updated"

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.root, previous: state },
        mutationPath: Path.parse("/users/0"),
        metadata: {
          operation: "set",
          props: ["name"],
        },
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

    it("publishes mutation metadata to subscribers", () => {
      const subscriber = jest.fn()
      const state = {
        users: [
          { name: "User 1", address: { street: "Street 1" } },
          { name: "User 2", address: { street: "Street 2" } },
        ],
      }

      const tree = new Arbor<State>(state)

      tree.subscribe(subscriber)

      delete tree.root.users[0].name

      expect(subscriber).toHaveBeenCalledWith({
        state: { current: tree.root, previous: state },
        mutationPath: Path.parse("/users/0"),
        metadata: {
          operation: "delete",
          props: ["name"],
        },
      })
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

      it("supports subsequent mutations to the same path when on forgiven mode", () => {
        const user = {
          name: "Alice",
          age: 30,
        }

        const store = new Arbor(user, {
          mode: MutationMode.FORGIVEN,
        })

        const alice = store.root
        delete alice.name
        delete alice.age

        expect(user).toEqual({})
        expect(alice).toEqual({})
        expect(store.root).toEqual({})
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
        new NodeHandler(tree, Path.root, state) as ProxyHandler<State>
      ) as INode<State>

      expect(node.$unwrap()).toBe(state)
      expect((node.users as INode<User[]>).$unwrap()).toBe(state.users)
      expect((node.users[0] as INode<User>).$unwrap()).toBe(state.users[0])
      expect((node.users[1] as INode<User>).$unwrap()).toBe(state.users[1])
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
        new NodeHandler(tree, Path.root, state) as ProxyHandler<State>
      ) as INode<State>

      expect(node.$path.toString()).toEqual("/")
      expect((node.users as INode<User[]>).$path.toString()).toEqual("/users")
      expect((node.users[0] as INode<User>).$path.toString()).toEqual(
        "/users/0"
      )
      expect((node.users[1] as INode<User>).$path.toString()).toEqual(
        "/users/1"
      )
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
        new NodeHandler(tree, Path.root, state) as ProxyHandler<State>
      ) as INode<State>

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
        new NodeHandler(tree, Path.root, state) as ProxyHandler<State>
      ) as INode<State>

      const copy = node.$clone()

      expect(node).not.toBe(copy)
      expect(node.users).toBe(copy.users)
      expect(node.users[0]).toBe(copy.users[0])
      expect(node.users[0].address).toBe(copy.users[0].address)
    })
  })
})
