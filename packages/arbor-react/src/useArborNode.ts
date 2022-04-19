import { useCallback, useEffect, useState } from "react"
import { isNode, INode, Path, ArborNode } from "@arborjs/store"

export default function useArborNode<T extends object>(node: ArborNode<T>) {
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

    return state.$subscribers.subscribe(({ mutationPath }) => {
      update(mutationPath)
    })
  }, [state, update])

  return state as ArborNode<T>
}
