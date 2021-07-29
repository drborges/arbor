import type Arbor from "@arborjs/store"
import { useEffect, useMemo, useState } from "react"

/**
 * This hook binds a React component to a given Arbor store.
 *
 * The component re-renders whenever the store updates and
 * the returned state object can be manipulated as a plain
 * JS object, mutations to the state will trigger mutation
 * operations on the store.
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
 * @param store an instance of the Arbor state tree.
 * @returns the current state of the Arbor state tree.
 */
export default function useArbor<T extends object>(store: Arbor<T>) {
  const [state, setState] = useState<T>(store.root)

  const unsubscribe = useMemo(
    () =>
      store.subscribe((newState) => {
        setState(newState)
      }),
    [store]
  )

  useEffect(() => unsubscribe, [unsubscribe])

  return state
}
