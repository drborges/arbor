import React, { memo } from "react"

import useTodos, { store } from "../store/useTodos"
import useTodosFilter, { filterTodos } from "../store/useTodosFilter"
import TodoView from "./TodoView"

export default memo(function TodoList() {
  const todos = useTodos()
  const filter = useTodosFilter()

  return (
    <div className="todo-list">
      {filterTodos(todos, filter.value).map((todo) => (
        <TodoView key={todo.uuid} id={todo.uuid} />
      ))}
    </div>
  )
})
