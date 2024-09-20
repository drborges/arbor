import React from "react"
import { useArbor } from "@arborjs/react"

import { Highlight } from "./Highlight"
import { store } from "../store"

export function StoreState() {
  const state = useArbor(store)

  return (
    <Highlight label="<StoreState />" key={Math.random()}>
      <div>
        <code>store.state.flag1: {state.flag1.toString()}</code>
      </div>
      <div>
        <code>store.state.flag2: {state.flag2.toString()}</code>
      </div>
      <div>
        <code>store.state.flag3: {state.flag3.toString()}</code>
      </div>
    </Highlight>
  )
}
