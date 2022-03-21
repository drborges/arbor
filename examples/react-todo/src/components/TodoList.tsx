import React, { memo, useCallback } from "react"

import TodoView from "./TodoView"
import useTodos from "../store/useTodos"
import useTodosFilter, { filterTodos } from "../store/useTodosFilter"

export default memo(function TodoList() {
  const todos = useTodos()
  const filter = useTodosFilter()

  return (
    <div className="todo-list">
      {filterTodos(todos, filter.value).map((todo) => (
        <TodoView
          key={todo.uuid}
          todo={todo}
          onRemove={todos.onRemove}
        />
      ))}
    </div>
  )
})
