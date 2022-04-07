import Arbor, { Node, proxiable, isNode, Subscriber } from "@arborjs/store"
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
  K extends Arbor | Node | object,
  T = K extends Arbor<infer D> ? D : K extends Node<infer D> ? D : K,
  S = T
>(target: K, selector = (root: T) => root as unknown as S) {
  if (!(target instanceof Arbor) && !isNode(target) && !proxiable(target)) {
    throw new Error(
      "useArbor must be initialized with either an instance of Arbor, an Arbor Node or a proxiable object"
    )
  }

  const store = useMemo(() => {
    if (target instanceof Arbor) return target
    if (isNode(target)) return target.$tree
    return new Arbor(target)
    // Initializes the store only once. We may need to revisit this
    // I'm thinking scenarios where users want to create local state
    // based on props that can change over time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const targetNode = useMemo(() => isNode(target) ? target : store.root, [store.root, target])
  const selectedNode = useMemo(() => selector(targetNode), [selector, targetNode])
  const [state, setState] = useState(selectedNode)

  const update: Subscriber<object> = useCallback(({ mutationPath }) => {
    if (!mutationPath.startsWith(targetNode.$path)) {
      return
    }

    const newTargetNode = store.getNodeAt(targetNode.$path)
    const newSelectedState = selector(newTargetNode as unknown as T)

    if (newSelectedState !== state) {
      setState(newSelectedState)
    }
  }, [selector, state, store, targetNode.$path])

  useEffect(() => {
    update({
      oldState: null,
      newState: targetNode,
      mutationPath: targetNode.$path,
    })

    return store.subscribe(update)
  }, [store, targetNode, update])

  return state
}
