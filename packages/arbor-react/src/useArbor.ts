import {
  Arbor,
  ArborNode,
  MutationEvent,
  isArborNode,
  isNode,
  isProxiable,
  path,
} from "@arborjs/store"
import { useCallback, useEffect, useMemo, useState } from "react"

import { watchAny } from "./watchAny"

export type Watcher<T extends object> = (
  target: ArborNode<T>,
  event: MutationEvent<T>
) => boolean

export function useArbor<T extends object>(
  store: Arbor<T>,
  watcher?: Watcher<T>
): ArborNode<T>

export function useArbor<T extends object>(
  node: ArborNode<T>,
  watcher?: Watcher<T>
): ArborNode<T>

export function useArbor<T extends object>(
  state: T,
  watcher?: Watcher<T>
): ArborNode<T>

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
 * import { Arbor, useArbor } from "@arborjs/react"
 *
 * const store = new Arbor({
 *    count: 0
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
 * @param target either an instance of Arbor or an ArborNode or a initial state object used to create a store.
 * @param watcher a watcher implementation that tells Arbor when to react to a given mutation event.
 * @returns the current state of the Arbor state tree.
 */
export function useArbor<T extends object>(
  target: ArborNode<T> | Arbor<T> | T,
  watcher: Watcher<T> = watchAny()
): ArborNode<T> {
  if (
    !(target instanceof Arbor) &&
    !isArborNode(target) &&
    !isProxiable(target)
  ) {
    throw new Error(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )
  }
  const store = useMemo(() => {
    if (target instanceof Arbor) return target
    if (isNode<T>(target)) return target.$tree
    return new Arbor<T>(target as T)
    // NOTE: useArbor has a similar behavior as the one of useState where
    // subsequent calls to the hook with new arguments do not create side-effects.
    // The hook's argument is simply the mechanism in which the hook is initialized
    // and further state changes must be triggered via mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const node = isArborNode<T>(target) ? target : store.state
  const targetPath = path(node)
  const [state, setState] = useState(node)

  const update = useCallback(
    (event: MutationEvent<T>) => {
      const nextState = store.getNodeAt<T>(targetPath)

      if (nextState !== state && watcher(state, event)) {
        setState(nextState)
      }
    },
    [state, store, targetPath, watcher]
  )

  useEffect(() => store.subscribeTo(state, update), [state, store, update])

  return state
}
