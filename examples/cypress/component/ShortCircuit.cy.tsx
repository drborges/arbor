import React from "react"

import { App } from "../../short-circuit/App"

describe("ShortCircuit App", () => {
  it("successfully renders components even when short circuit boolean logic is used", () => {
    cy.mount(<App />)

    cy.contains("state.flags.flag1: false")
    cy.contains("state.flags.flag2: false")
    cy.contains("state.flags.flag3: false")
    cy.contains("app.flags.flag1 || app.flags.flag2 || app.flags.flag3 = false")
    cy.contains("app.flags.flag1 && app.flags.flag2 && app.flags.flag3 = false")

    cy.get("[data-testid='toggle-flag3']").click()

    cy.contains("state.flags.flag1: false")
    cy.contains("state.flags.flag2: false")
    cy.contains("state.flags.flag3: true")
    cy.contains("app.flags.flag1 || app.flags.flag2 || app.flags.flag3 = true")
    cy.contains("app.flags.flag1 && app.flags.flag2 && app.flags.flag3 = false")

    cy.get("[data-testid='toggle-flag2']").click()

    cy.contains("state.flags.flag1: false")
    cy.contains("state.flags.flag2: true")
    cy.contains("state.flags.flag3: true")
    cy.contains("app.flags.flag1 || app.flags.flag2 || app.flags.flag3 = true")
    cy.contains("app.flags.flag1 && app.flags.flag2 && app.flags.flag3 = false")

    cy.get("[data-testid='toggle-flag1']").click()

    cy.contains("state.flags.flag1: true")
    cy.contains("state.flags.flag2: true")
    cy.contains("state.flags.flag3: true")
    cy.contains("app.flags.flag1 || app.flags.flag2 || app.flags.flag3 = true")
    cy.contains("app.flags.flag1 && app.flags.flag2 && app.flags.flag3 = true")

    cy.get("[data-testid='toggle-flag3']").click()

    cy.contains("state.flags.flag1: true")
    cy.contains("state.flags.flag2: true")
    cy.contains("state.flags.flag3: false")
    cy.contains("app.flags.flag1 || app.flags.flag2 || app.flags.flag3 = true")
    cy.contains("app.flags.flag1 && app.flags.flag2 && app.flags.flag3 = false")

    cy.get("[data-testid='toggle-flag2']").click()

    cy.contains("state.flags.flag1: true")
    cy.contains("state.flags.flag2: false")
    cy.contains("state.flags.flag3: false")
    cy.contains("app.flags.flag1 || app.flags.flag2 || app.flags.flag3 = true")
    cy.contains("app.flags.flag1 && app.flags.flag2 && app.flags.flag3 = false")

    cy.get("[data-testid='toggle-flag1']").click()

    cy.contains("state.flags.flag1: false")
    cy.contains("state.flags.flag2: false")
    cy.contains("state.flags.flag3: false")
    cy.contains("app.flags.flag1 || app.flags.flag2 || app.flags.flag3 = false")
    cy.contains("app.flags.flag1 && app.flags.flag2 && app.flags.flag3 = false")
  })
})
