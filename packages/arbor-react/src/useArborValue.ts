import Arbor, { Node } from "@arborjs/store"

import useArbor from "./useArbor"

function isNode<T extends object>(value: any): value is Node<T> {
  const isNodeValue = value as Node<T>
  return typeof isNodeValue?.$unwrap === "function"
}

export default function useArborValue<T extends object, S = T>(
  store: Arbor<T>,
  selector = (root: T) => root as unknown as S
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
