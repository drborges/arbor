import Arbor, { INode } from "@arborjs/store"
import { useEffect, useState } from "react"

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
export default function useArbor<T extends object, S extends object = T>(
  store: Arbor<T>,
  selector = (root: T): S => root as unknown as S
) {
  const value = selector(store.root)
  const [state, setState] = useState(value)

  useEffect(() => {
    setState(value)
  }, [value])

  useEffect(
    () =>
      store.subscribe((newState) => {
        const node = value as INode<S>
        const newNode = node?.$path.walk(newState)
        if (newNode !== node) {
          setState(newNode as S)
        }
      }),
    [store, value]
  )

  return state
}
