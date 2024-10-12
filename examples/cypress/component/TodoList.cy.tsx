import React from "react"

import TodoListApp, { store } from "../../react-todo/App"
import { TodoList } from "../../react-todo/store/useTodos"

describe("TodoList", () => {
  beforeEach(() => {
    store.setState(new TodoList())
  })

  it("successfully manages the state of a Todo List app via Arbor", () => {
    cy.mount(<TodoListApp />)

    cy.findByTestId("add-todo-input").type("Clean the house")
    cy.findByText("Add").click()

    cy.findByText("0 of 1 completed").should("exist")

    cy.findByTestId("add-todo-input").type("Walk the dogs")
    cy.findByText("Add").click()

    cy.findByText("0 of 2 completed").should("exist")

    cy.findByText("Clean the house").should("exist")
    cy.findByText("Walk the dogs").should("exist")

    cy.findByText("Clean the house").click()

    cy.findByText("1 of 2 completed").should("exist")

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

    cy.findByText("All")
      .click()
      .then(() => {
        const todos = Array.from(store.state.values())
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
        cy.findByText("0 of 1 completed").should("exist")
      })
  })

  it("preserves list items references within store upon removal", () => {
    cy.mount(<TodoListApp />)

    cy.findByTestId("add-todo-input").type("Clean the house")
    cy.findByText("Add").click()

    cy.findByTestId("add-todo-input").type("Walk the dogs")
    cy.findByText("Add").click()

    cy.findByText("All")
      .click()
      .then(() => {
        const todo1 = store.state[0]
        const todo2 = store.state[1]

        cy.findByTestId(`todo-${todo1.id}`).within(() => {
          cy.findByText("Delete").click()
        })

        cy.findByTestId(`todo-${todo2.id}`).within(() => {
          cy.findByText("Delete").click()
        })
      })
  })
})
