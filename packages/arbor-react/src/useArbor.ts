import { useCallback, useEffect, useMemo, useState } from "react"
import Arbor, {
  ArborNode,
  INode,
  isNode,
  MutationEvent,
  proxiable,
} from "@arborjs/store"

import { watchAnyMutations } from "./watchAnyMutations"

export type Watcher<T extends object> = (
  target: ArborNode<T>,
  event: MutationEvent
) => boolean

function useArbor<T extends object>(
  store: Arbor<T>,
  watcher?: Watcher<T>
): ArborNode<T>

function useArbor<T extends object>(
  node: ArborNode<T>,
  watcher?: Watcher<T>
): ArborNode<T>

function useArbor<T extends object>(
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
 * import Arbor, { useArbor } from "@arborjs/react"
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
 * Additionally, one can also provide an instance of `Repository`
 * wrapping the store, which provides built-in CRUD operations for
 * managing a collection of objects.
 *
 * In that case, make sure you add @arborjs/repository as a dependency.
 *
 * @param target either an instance of Arbor or an ArborNode or a initial state object used to create a store.
 * @param watcher a watcher implementation that tells Arbor when to react to a given mutation event.
 * @returns the current state of the Arbor state tree.
 */
function useArbor<T extends object>(
  target: Arbor<T> | ArborNode<T> | T,
  watcher: Watcher<T> = watchAnyMutations()
): ArborNode<T> {
  if (!(target instanceof Arbor) && !isNode(target) && !proxiable(target)) {
    throw new Error(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )
  }
  const store = useMemo(() => {
    if (target instanceof Arbor) return target
    if (isNode(target)) return target.$tree
    return new Arbor<T>(target as T)
    // TODO: Revisit this decision on whether or not we'd like to recompute the
    // store whenever the target memory reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const targetPath = useMemo(
    () => (isNode(target) ? target.$path : (store.root as INode).$path),
    [store, target]
  )

  const node = useMemo(
    () => store.getNodeAt(targetPath) as INode<T>,
    [store, targetPath]
  )

  const [state, setState] = useState(node)

  const update = useCallback(
    (event: MutationEvent) => {
      const nextState = store.getNodeAt(targetPath) as INode<T>

      if (nextState !== state && watcher(state, event)) {
        setState(nextState)
      }
    },
    [state, store, targetPath, watcher]
  )

  useEffect(() => {
    update({
      mutationPath: state.$path,
      metadata: {
        operation: "set",
        props: [],
      },
      state: {
        current: store.root,
        previous: store.root,
      },
    })

    return store.subscribeTo(state as ArborNode<T>, update)
  }, [state, store, target, targetPath, update])

  return state as ArborNode<T>
}

export default useArbor
