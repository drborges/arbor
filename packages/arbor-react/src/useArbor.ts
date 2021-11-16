import Arbor from "@arborjs/store"
import { useEffect, useState } from "react"
import Repository, { IRepository } from "@arborjs/repository"

/**
 * This hook binds a React component to a given Arbor store.
 *
 * The component re-renders whenever the store updates and
 * the returned state object can be manipulated as a plain
 * JS object, mutations to the state will trigger mutation
 * operations on the store ensuring structural sharing is
 * used to copute the next state.
 *
 * @example The following example implements a simple
 * counter app that demonstrates its usage:
 *
 * ```ts
 * import Arbor, { useArbor } from "@arborjs/react"
 *
 * const store = new Arbor({
 *   count: 0
 * })
 *
 * export default function CounterApp() {
 *   const state = useArbor(store)
 *
 *   return (
 *     <button onClick={() => (state.count++)}>{state.count}</button>
 *   )
 * }
 * ```
 *
 * Additionally, one can also provide an instance of `Repository`
 * wrapping the store, which provides built-in CRUD operations for
 * managing a collection of objects.
 *
 * In that case, make sure you add @arborjs/repository as a dependency.
 *
 * @param storeOrRepository either an instance of Arbor or Repository.
 * @returns the current state of the Arbor state tree.
 */
export default function useArbor<
  K extends Arbor | Repository,
  T = K extends Arbor<infer D>
    ? D
    : K extends Repository<infer D>
    ? IRepository<D>
    : never,
  S = T
>(storeOrRepository: K, selector = (root: T) => root as unknown as S) {
  const store =
    storeOrRepository instanceof Arbor
      ? storeOrRepository
      : storeOrRepository.store

  const [state, setState] = useState(selector(store.root))

  useEffect(() => {
    setState(selector(store.root))
  }, [selector])

  useEffect(
    () => store.subscribe(() => setState(selector(store.root))),
    [selector, store]
  )

  return state
}
