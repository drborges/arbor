import { Arbor, ArborNode, Node, isArborNode } from "@arborjs/store"
import { useEffect, useState } from "react"

export type Selector<T extends object, S> = (node: ArborNode<T>) => S

export function useArborSelector<T extends object, S>(
  target: ArborNode<T> | Arbor<T>,
  selector: Selector<T, S>
) {
  if (!(target instanceof Arbor) && !isArborNode(target)) {
    throw new Error(
      "useArborSelector must be initialized with either an instance of Arbor or an ArborNode"
    )
  }
  const node = target instanceof Arbor ? target.state : target
  const store = (node as Node).$tree
  const [state, setState] = useState(selector(node))

  useEffect(() => {
    return store.subscribeTo(node, () => {
      const selected = selector(node)
      if (selected !== state) {
        setState(selected)
      }
    })
  }, [node, selector, state, store])

  return state
}
