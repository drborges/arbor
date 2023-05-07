import React from "react"

import CounterApp, { store } from "../../react-counter/Counter"

describe("Counter", () => {
  beforeEach(() => {
    store.setState({ count: 0 })
  })

  it("successfully manages the state of a Counter app with memoized components", () => {
    cy.mount(<CounterApp />)

    cy.findByText("Count: 0").should("exist")

    cy.findByText("-1").click()
    cy.findByText("-1").click()

    cy.findByText("Count: -2").should("exist")

    cy.findByText("+1").click()
    cy.findByText("+1").click()
    cy.findByText("+1").click()

    cy.findByText("Count: 1").should("exist")
  })
})
