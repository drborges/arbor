import React from "react"

import { App } from "../../short-circuit/App"

describe("ShortCircuit App", () => {
  it("successfully renders components even when short circuit boolean logic is used", () => {
    cy.mount(<App />)

    cy.contains("store.state.flag1: false")
    cy.contains("store.state.flag2: false")
    cy.contains("store.state.flag3: false")
    cy.contains(
      "store.state.flag1 || store.state.flag2 || store.state.flag3 = false"
    )
    cy.contains(
      "store.state.flag1 && store.state.flag2 && store.state.flag3 = false"
    )

    cy.get("[data-testid='toggle-flag3']").click()

    cy.contains("store.state.flag1: false")
    cy.contains("store.state.flag2: false")
    cy.contains("store.state.flag3: true")
    cy.contains(
      "store.state.flag1 || store.state.flag2 || store.state.flag3 = true"
    )
    cy.contains(
      "store.state.flag1 && store.state.flag2 && store.state.flag3 = false"
    )

    cy.get("[data-testid='toggle-flag2']").click()

    cy.contains("store.state.flag1: false")
    cy.contains("store.state.flag2: true")
    cy.contains("store.state.flag3: true")
    cy.contains(
      "store.state.flag1 || store.state.flag2 || store.state.flag3 = true"
    )
    cy.contains(
      "store.state.flag1 && store.state.flag2 && store.state.flag3 = false"
    )

    cy.get("[data-testid='toggle-flag1']").click()

    cy.contains("store.state.flag1: true")
    cy.contains("store.state.flag2: true")
    cy.contains("store.state.flag3: true")
    cy.contains(
      "store.state.flag1 || store.state.flag2 || store.state.flag3 = true"
    )
    cy.contains(
      "store.state.flag1 && store.state.flag2 && store.state.flag3 = true"
    )

    cy.get("[data-testid='toggle-flag3']").click()

    cy.contains("store.state.flag1: true")
    cy.contains("store.state.flag2: true")
    cy.contains("store.state.flag3: false")
    cy.contains(
      "store.state.flag1 || store.state.flag2 || store.state.flag3 = true"
    )
    cy.contains(
      "store.state.flag1 && store.state.flag2 && store.state.flag3 = false"
    )

    cy.get("[data-testid='toggle-flag2']").click()

    cy.contains("store.state.flag1: true")
    cy.contains("store.state.flag2: false")
    cy.contains("store.state.flag3: false")
    cy.contains(
      "store.state.flag1 || store.state.flag2 || store.state.flag3 = true"
    )
    cy.contains(
      "store.state.flag1 && store.state.flag2 && store.state.flag3 = false"
    )

    cy.get("[data-testid='toggle-flag1']").click()

    cy.contains("store.state.flag1: false")
    cy.contains("store.state.flag2: false")
    cy.contains("store.state.flag3: false")
    cy.contains(
      "store.state.flag1 || store.state.flag2 || store.state.flag3 = false"
    )
    cy.contains(
      "store.state.flag1 && store.state.flag2 && store.state.flag3 = false"
    )
  })
})
