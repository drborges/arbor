import Arbor, { proxiable } from "@arborjs/store"
import { useCallback, useEffect, useMemo, useState } from "react"

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
  K extends Arbor<object> | object,
  T = K extends Arbor<infer D> ? D : K,
  S = T
>(storeOrState: K, selector = (root: T) => root as unknown as S) {
  if (!(storeOrState instanceof Arbor) && !proxiable(storeOrState)) {
    throw new Error(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )
  }

  const store = useMemo(
    () =>
      storeOrState instanceof Arbor ? storeOrState : new Arbor(storeOrState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Ensure the store is initialized only once in case the caller is providing an initial state value
  )

  const [state, setState] = useState(selector(store.root))

  const update = useCallback(() => {
    const nextState = selector(store.root)

    if (nextState !== state) {
      setState(nextState)
    }
  }, [selector, state, store.root])

  useEffect(() => {
    update()

    return store.subscribe(update)
  }, [selector, store, update])

  return state
}
