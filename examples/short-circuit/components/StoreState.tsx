import React from "react"
import { useArbor } from "@arborjs/react"

import { Highlight } from "./Highlight"
import { store } from "../store"

export function StoreState() {
  const state = useArbor(store)

  return (
    <Highlight label="<StoreState />" key={Math.random()}>
      <div>
        <code>state.flags.flag1: {state.flags.flag1.toString()}</code>
      </div>
      <div>
        <code>state.flags.flag2: {state.flags.flag2.toString()}</code>
      </div>
      <div>
        <code>state.flags.flag3: {state.flags.flag3.toString()}</code>
      </div>
    </Highlight>
  )
}
