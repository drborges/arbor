import React from "react"

import Summary from "./components/Summary"
import NewTodoForm from "./components/NewTodoForm"
import SimpleTodoList from "./components/SimpleTodoList"

import "./index.css"

export default function SimpleApp() {
  return (
    <div className="app">
      <h1>todos</h1>

      <div className="body">
        <NewTodoForm />
        <SimpleTodoList />

        <div className="footer">
          <Summary />
        </div>
      </div>
    </div>
  )
}
