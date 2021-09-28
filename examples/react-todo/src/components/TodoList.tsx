import React from "react"

import TodoView from "./TodoView"
import useTodos from "../store/useTodos"
import useTodosFilter from "../store/useTodosFilter"

export default function TodoList() {
  const { todos } = useTodos()
  const { filter } = useTodosFilter()

  return (
    <div className="todo-list">
      {filter(todos).map((todo) => (
        <TodoView
          key={todo.id}
          todo={todo}
          onRemove={() => {
            const index = todos.findIndex((t) => t.id === todo.id)
            delete todos[index]
          }}
        />
      ))}
    </div>
  )
}
