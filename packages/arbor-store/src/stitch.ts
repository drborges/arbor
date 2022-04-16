import Arbor, { INode } from "./Arbor"

/**
 * Ensure that updates to the stitched store's root keys are propagated to the corresponding underlying store.
 *
 * This allows users to work with the stitched store as if it was one single global store.
 *
 * @example
 *
 * ```ts
 * const users = new Arbor([])
 * const posts = new Arbor([])
 * const app = stitch({ users, posts })
 *
 * app.root.users = [{ name: "John Doe" }]
 *
 * expect(app.root.users).toEqual(users.root)
 * ```
 *
 * @param store and instance of Arbor.
 * @param descriptor object describing how the final stitched store state will map to the underlying stores.
 */
function propagateUpdatesToUnderlyingStores<T extends object>(
  store: Arbor<T>,
  descriptor: Descriptor
) {
  store.subscribe((newState) => {
    Object.entries(newState.$unwrap()).forEach(([key, value]) => {
      const stitchedStore = descriptor[key]
      const root = stitchedStore.root as INode<T>

      if (root.$unwrap() !== value) {
        stitchedStore.setRoot(value)
      }
    })
  })
}

/**
 * Subscribes the given store to updates triggered by the underlying stores.
 *
 * This ensures the stitched store's state is always up-to-date with the underlying stores.
 *
 * @example
 *
 * ```ts
 * const users = new Arbor([])
 * const posts = new Arbor([])
 * const app = stitch({ users, posts })
 *
 * users.root.push({ name: "John Doe" })
 *
 * expect(app.root.users).toEqual(users.root)
 * ```
 *
 * @param store an instance of Arbor.
 * @param descriptor object describing how the final stitched store state will map to the underlying stores.
 */
function subscribeToUnderlyingStoreUpdates<T extends object>(
  store: Arbor<T>,
  descriptor: Descriptor
) {
  Object.entries(descriptor).forEach((entry) => {
    const [key, stitchedStore] = entry
    stitchedStore.subscribe((underlyingStoreNewRoot) => {
      const value = underlyingStoreNewRoot.$unwrap()

      if (store.root[key]?.$unwrap() !== value) {
        store.root[key] = value
      }
    })
  })
}

/**
 * Describes how Arbor stores should be stitched together to create a final
 * stitched Arbor store.
 *
 * @example
 *
 * ```ts
 * const users = new Arbor([])
 * const posts = new Arbor([])
 *
 * const descriptor = {
 *   users,
 *   posts,
 * }
 * ```
 */
export type Descriptor = {
  [key: string]: Arbor<object>
}

/**
 * Stitches multiple Arbor stores together, creating a unified, global store.
 *
 * @example
 *
 * ```ts
 * const users = new Arbor([])
 * const posts = new Arbor([])
 * const app = stitch({ users, posts })
 *
 * app.root.users.push({ name: "A new user" })
 * app.root.posts.push({ content: "A new post" })
 * ```
 *
 * @param descriptor maps Arbor stores the their corresponding keys used to represent the state of the final stitched store.
 * @returns the resulting stitched Arbor store.
 */
export default function stitch<T extends object>(
  descriptor: Descriptor
): Arbor<T> {
  const initialState = Object.entries(descriptor).reduce((state, entry) => {
    const [key, store] = entry
    const root = store.root as INode<T>
    state[key] = root.$unwrap()
    return state
  }, {}) as T

  const store = new Arbor(initialState)

  propagateUpdatesToUnderlyingStores<T>(store, descriptor)
  subscribeToUnderlyingStoreUpdates<T>(store, descriptor)

  return store
}
