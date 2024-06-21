import {
  Arbor,
  ArborNode,
  isNode,
  isProxiable,
  ScopedStore,
  Store,
} from "@arborjs/store"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"

const useStore = useSyncExternalStore ? useArborNew : useArborDeprecated

/**
 * Allow connecting a React component to an Arbor store allowing mutations to be triggered from
 * a reactive version of the store's state.
 *
 * For React > 18.0.0, useSyncExternalStore is used under the hoods to provide better integration
 * with React's concurrent rendering, otherwise useState is the building block used to integrate
 * with React.
 *
 * Components can connect to the Arbor store itself being able to watch for any mutations triggered
 * on the store, or a specific Node in the state tree.
 *
 * When connecting to an object other than a store or an Arbor Node, a local store is created
 * automatically, and the behavior of the hook is similar to what you'd have when using useState.
 *
 * @param target the target to connect to.
 *
 * @returns the current store's state as a reactive object.
 */
export function useArbor<T extends object>(
  target: ArborNode<T> | Arbor<T> | T
): ArborNode<T> {
  if (!(target instanceof Arbor) && !isNode(target) && !isProxiable(target)) {
    throw new Error(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )
  }

  const scopedStore = useMemo(() => {
    let targetNode: ArborNode<T>

    if (target instanceof Arbor) {
      targetNode = target.state
    } else if (isNode<T>(target)) {
      targetNode = target
    } else {
      const store = new Arbor(target as T)
      targetNode = store.state
    }

    return new ScopedStore(targetNode)
    // NOTE: useArbor has a similar behavior as the one of useState where
    // subsequent calls to the hook with new arguments do not create side-effects.
    // The hook's argument is simply the mechanism in which the hook is initialized
    // and further state changes must be triggered via mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  scopedStore.scope.reset()

  return useStore(scopedStore)
}

// For versions of React where useSyncExternalStore is not available we resort
// to tracking the store's state as a local useState.
function useArborDeprecated<T extends object>(store: Store<T>): ArborNode<T> {
  const [state, setState] = useState(store.state)

  useEffect(() => {
    // Forces a initial re-render in case the state changes before
    // React has a chance to subscribe to the store
    if (store.state !== state) {
      setState(store.state)
    }

    return store.subscribe(() => {
      setState(store.state)
    })
  }, [state, store])

  return state
}

// Levering useSyncExternalStore makes Arbor compatible with React's
// concurrent mode.
function useArborNew<T extends object>(store: Store<T>): ArborNode<T> {
  return useSyncExternalStore(store.subscribe.bind(store), () => store.state)
}
