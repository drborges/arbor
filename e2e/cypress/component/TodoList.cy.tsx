import { Repository } from "@arborjs/store"
import React from "react"

import App from "react-todo"
import { store } from "react-todo/src/store/useTodos"

describe("TodoList", () => {
  beforeEach(() => {
    store.setState(new Repository())
  })

  it("successfully manages the state of a Todo List app via Arbor", async () => {
    cy.mount(<App />)

    cy.findByTestId("add-todo-input").type("Clean the house")
    cy.findByText("Add").click()

    cy.findByTestId("add-todo-input").type("Walk the dogs")
    cy.findByText("Add").click()

    cy.findByText("Clean the house").should("exist")
    cy.findByText("Walk the dogs").should("exist")

    cy.findByText("Clean the house").click()

    cy.findByText("Completed").click()

    cy.findByText("Clean the house").should("exist")
    cy.findByText("Walk the dogs").should("not.exist")

    cy.findByText("Active").click()

    cy.findByText("Clean the house").should("not.exist")
    cy.findByText("Walk the dogs").should("exist")

    cy.findByText("All").click()

    cy.findByText("Clean the house").should("exist")
    cy.findByText("Walk the dogs").should("exist")

    cy.findByText("Active").click()

    cy.findByText("Walk the dogs").click()

    cy.findByText("Clean the house").should("not.exist")
    cy.findByText("Walk the dogs").should("not.exist")

    cy.findByText("Completed").click()

    cy.findByText("Clean the house").should("exist")
    cy.findByText("Walk the dogs").should("exist")

    cy.findByText("Clean the house").click()
    cy.findByText("Walk the dogs").click()

    cy.findByText("Clean the house").should("not.exist")
    cy.findByText("Walk the dogs").should("not.exist")

    cy.findByText("All").click().then(() => {
      const todos = [...store.state]
      cy.findByTestId(`todo-${todos[0].id}`).within(() => {
        cy.findByText("Edit").click()
        cy.focused().type("... again...").blur()
        cy.findByText("Clean the house... again...").should("exist")
        cy.findByText("Like").click()
        cy.findByText("Like").click()
        cy.findByText("Likes: 2").should("exist")
        cy.findByText("Delete").click()
      })

      cy.findByText("Clean the house... again...").should("not.exist")
    })
  })
})
