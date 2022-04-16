import { isNode, INode, Path } from "@arborjs/store"
import { useCallback, useEffect, useState } from "react"

export default function useArborNode<T extends object>(node: INode<T> | T) {
  if (!isNode(node)) {
    throw new Error("useArborNode must be initialized with an Arbor Node")
  }

  const [state, setState] = useState(node)

  const update = useCallback(
    (mutationPath: Path) => {
      if (mutationPath.is(state.$path)) {
        const nextState = state.$tree.getNodeAt(state.$path) as INode<T>

        if (state !== nextState) {
          setState(nextState)
        }
      }
    },
    [state]
  )

  useEffect(() => {
    update(state.$path)

    return state.$tree.subscribe(({ mutationPath }) => update(mutationPath))
  }, [state, update])

  return state
}
