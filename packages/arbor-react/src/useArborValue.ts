import Arbor, { ArborNode, isNode } from "@arborjs/store"

import useArbor from "./useArbor"

export default function useArborValue<T extends object, S = T>(
  store: Arbor<T>,
  selector = (root: ArborNode<T>) => root as unknown as S
): S {
  if (!(store instanceof Arbor)) {
    throw new Error(
      "useAborValue must be initialized with an instance of an Arbor store"
    )
  }

  const state = useArbor(store, selector)
  const value = isNode(state) ? state.$unwrap() : state
  return value as S
}
