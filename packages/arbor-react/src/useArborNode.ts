import { useEffect, useState } from "react"
import { isNode, Node } from "@arborjs/store"

export default function useArborNode<T extends object>(node: Node<T> | T) {
  if (!isNode(node)) {
    throw new Error("useArborNode must be initialized with an Arbor Node")
  }

  const [state, setState] = useState(node)

  useEffect(() => {
    if (state !== node) {
      setState(node)
    }

    return state.$subscribe(({ newState }) => setState(newState))
  }, [node, state])

  return state
}
