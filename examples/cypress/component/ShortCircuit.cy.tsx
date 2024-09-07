import React from "react"

import { App } from "../../short-circuit/App"

describe("ShortCircuit App", () => {
  it("successfully renders components even when short circuit boolean logic is used", () => {
    cy.mount(<App />)
  })
})
