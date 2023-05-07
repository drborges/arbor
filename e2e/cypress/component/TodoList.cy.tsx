import React from "react"
import { mount } from "cypress/react"

import App from "react-todo"

describe("TodoList", () => {
  it("successfully manages the state of a Todo List app via Arbor", () => {
    mount(<App />)
  })
})
