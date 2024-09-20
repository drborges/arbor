import React from "react"

import { Highlight } from "./components/Highlight"
import { StoreState } from "./components/StoreState"
import { Actions } from "./components/Actions"
import { AreThereAnyFlagsTrue } from "./components/AreThereAnyFlagsTrue"
import { AreAllFlagsTrue } from "./components/AreAllFlagsTrue"

import "./styles.css"

export function App() {
  return (
    <Highlight label="<App />" key={Math.random()}>
      <Actions />
      <StoreState />
      <AreThereAnyFlagsTrue />
      <AreAllFlagsTrue />
    </Highlight>
  )
}
