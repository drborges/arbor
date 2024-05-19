import React, { memo } from "react"

import { useArbor } from "@arborjs/react"
import { TodoList, store } from "../store/useTodos"
import useTodosFilter, { filterTodos } from "../store/useTodosFilter"
import TodoView from "./TodoView"

export default memo(function TodoList() {
  const todos = useArbor(store) as TodoList
  const filter = useTodosFilter()

  return (
    <div className="todo-list">
      {filterTodos(todos, filter.value).map((todo) => (
        <TodoView key={todo.uuid} id={todo.uuid} />
      ))}
    </div>
  )
})
