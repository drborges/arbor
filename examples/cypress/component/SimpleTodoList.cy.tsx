import React from "react"

import { TodoList, store } from "../../react-todo/store/useTodos"
import SimpleTodoListApp from "../../react-todo/SimpleApp"

describe("SimpleTodoList", () => {
  beforeEach(() => {
    store.setState(new TodoList())
  })

  it("preserves list items references within store upon removal", () => {
    cy.mount(<SimpleTodoListApp />)

    cy.findByTestId("add-todo-input").type("Clean the house")
    cy.findByText("Add").click()

    cy.findByTestId("add-todo-input").type("Walk the dogs")
    cy.findByText("Add")
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
