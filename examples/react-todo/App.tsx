import React from "react"

import Filters from "./components/Filters"
import Summary from "./components/Summary"
import TodoList from "./components/TodoList"
import NewTodoForm from "./components/NewTodoForm"

export { store } from "./store/useTodos"

import "./index.css"

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
