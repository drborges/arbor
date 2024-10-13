import React from "react"
import { useArbor } from "@arborjs/react"

import { Highlight } from "./Highlight"
import { store } from "../store"

export function AreThereAnyFlagsTrue() {
  const app = useArbor(store)
  return (
    <Highlight label="<AreThereAnyFlagsTrue />" key={Math.random()}>
      <code>
        store.state.flag1 || store.state.flag2 || store.state.flag3 ={" "}
        {(app.flag1 || app.flag2 || app.flag3).toString()}
      </code>
    </Highlight>
  )
}
