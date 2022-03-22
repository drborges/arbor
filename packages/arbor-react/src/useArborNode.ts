import { isNode, Node, Path } from "@arborjs/store"
import { useCallback, useEffect, useState } from "react"

export default function useArborNode<T extends object>(node: Node<T> | T) {
  if (!isNode(node)) {
    throw new Error("Input is not a valid Arbor node.")
  }

  const [state, setState] = useState(node)

  const update = useCallback((mutationPath: Path) => {
    if (mutationPath.is(state.$path)) {
      const nextState = state.$tree.getNodeAt(state.$path) as Node<T>
      setState(nextState)
    }
  }, [state])

  useEffect(() => {
    update(state.$path)

    state.$tree.subscribe((_new, _old, mutationPath) => update(mutationPath))
  }, [state, update])

  return state
}
