import React from "react"

import TodoView from "./TodoView"
import useTodos from "../store/useTodos"
import useTodosFilter, { filterTodos } from "../store/useTodosFilter"

export default function TodoList() {
  const todos = useTodos()
  const filter = useTodosFilter()

  return (
    <div className="todo-list">
      {filterTodos(todos, filter.value).map((todo) => (
        <TodoView
          key={todo.id}
          todo={todo}
          onRemove={todo.detach}
        />
      ))}
    </div>
  )
}
