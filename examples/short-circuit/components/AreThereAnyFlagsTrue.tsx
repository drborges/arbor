import React from "react"
import { useArbor } from "@arborjs/react"

import { Highlight } from "./Highlight"
import { store } from "../store"

export function AreThereAnyFlagsTrue() {
  const app = useArbor(store)
  return (
    <Highlight label="<AreThereAnyFlagsTrue />" key={Math.random()}>
      <h1>
        Are there any flags <code>true</code>?
      </h1>
      <div>
        {app.flags.flag1 || app.flags.flag2 || app.flags.flag3 ? "Yes" : "No"}
      </div>
    </Highlight>
  )
}
