import React, { memo } from "react"
import { useArbor } from "@arborjs/react"

import { TodoList, store } from "../store/useTodos"
import TodoView from "./TodoView"

export default memo(function SimpleTodoList() {
  const todos = useArbor(store) as TodoList

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoView key={todo.uuid} id={todo.uuid} />
      ))}
    </div>
  )
})
