import React from "react"

import Filters from "./Filters"
import Summary from "./Summary"
import TodoList from "./TodoList"
import NewTodoForm from "./NewTodoForm"

import "../index.css"

export default function App() {
  return (
    <div className="app">
      <h1>todos</h1>

      <div className="body">
        <NewTodoForm />
        <TodoList />

        <div className="footer">
          <Summary />
          <Filters />
        </div>
      </div>
    </div>
  )
}
