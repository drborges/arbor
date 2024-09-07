import React from "react"

import { Highlight } from "./Highlight"
import { store } from "../store"

export function Actions() {
  return (
    <Highlight label="<Actions />" key={Math.random()}>
      <button onClick={store.state.flags.toggleFlag1}>
        Toggle <code>store.state.flag1</code>
      </button>
      <button onClick={store.state.flags.toggleFlag2}>
        Toggle <code>store.state.flag2</code>
      </button>
      <button onClick={store.state.flags.toggleFlag3}>
        Toggle <code>store.state.flag3</code>
      </button>
    </Highlight>
  )
}
