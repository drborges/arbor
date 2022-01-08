import { useMemo } from "react"
import Arbor from "@arborjs/store"

import useArbor from "./useArbor"

export default function useArborState<T extends object>(initialState: T): T {
  const store = useMemo(() => new Arbor(initialState), [])
  return useArbor(store)
}
