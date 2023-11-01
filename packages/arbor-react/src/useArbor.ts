import {
  Arbor,
  ArborNode,
  Watcher,
  isNode,
  isProxiable,
  track,
} from "@arborjs/store"
import { useMemo, useSyncExternalStore } from "react"

export function useArbor<T extends object>(
  target: ArborNode<T> | Arbor<T> | T,
  watcher?: Watcher<T>
): ArborNode<T> {
  if (!(target instanceof Arbor) && !isNode(target) && !isProxiable(target)) {
    throw new Error(
      "useArbor must be initialized with either an instance of Arbor or a proxiable object"
    )
  }

  const trackedStore = useMemo(() => {
    let targetNode: ArborNode<T>

    if (target instanceof Arbor) {
      targetNode = target.state
    } else if (isNode<T>(target)) {
      targetNode = target
    } else {
      const store = new Arbor(target as T)
      targetNode = store.state
    }

    return track(targetNode, watcher)
    // NOTE: useArbor has a similar behavior as the one of useState where
    // subsequent calls to the hook with new arguments do not create side-effects.
    // The hook's argument is simply the mechanism in which the hook is initialized
    // and further state changes must be triggered via mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useSyncExternalStore(
    trackedStore.subscribe.bind(trackedStore),
    () => trackedStore.state
  )
}
