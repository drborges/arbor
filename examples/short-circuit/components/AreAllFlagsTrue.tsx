import React from "react"
import { useArbor } from "@arborjs/react"

import { Highlight } from "./Highlight"
import { store } from "../store"

export function AreAllFlagsTrue() {
  const app = useArbor(store)
  return (
    <Highlight label="<AreAllFlagsTrue />" key={Math.random()}>
      <h1>
        Are all flags <code>true</code>?
      </h1>
      <div>
        {app.flags.flag1 && app.flags.flag2 && app.flags.flag3 ? "Yes" : "No"}
      </div>
    </Highlight>
  )
}
