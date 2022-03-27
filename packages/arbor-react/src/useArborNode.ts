import { isNode, Node, Path } from "@arborjs/store"
import { useCallback, useEffect, useState } from "react"

export default function useArborNode<T extends object>(node: Node<T> | T) {
  if (!isNode(node)) {
    throw new Error("useArborNode must be initialized with an Arbor Node")
  }

  const [state, setState] = useState(node)

  const update = useCallback((mutationPath: Path) => {
    if (mutationPath.is(state.$path)) {
      const nextState = state.$tree.getNodeAt(state.$path) as Node<T>

      if (state !== nextState) {
        setState(nextState)
      }
    }
  }, [state])

  useEffect(() => {
    update(state.$path)

    return state.$tree.subscribe((_new, _old, mutationPath) => update(mutationPath))
  }, [state, update])

  return state
}
