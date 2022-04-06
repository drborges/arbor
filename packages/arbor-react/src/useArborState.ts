import { useCallback, useState } from "react"
import { Mutation, Node, produce } from "@arborjs/store"

export type ArborState<T extends object> = [T, (m: Mutation<Node<T>>) => void]

export default function useArborState<T extends object>(
  initial: T
): ArborState<T> {
  const [value, setValue] = useState(initial)
  const setState = useCallback((mutation: Mutation<Node<T>>) => {
    setValue(produce(mutation))
  }, [])

  return [value, setState]
}
