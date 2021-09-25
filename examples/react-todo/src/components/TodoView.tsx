import classnames from "classnames"
import React, { ChangeEvent, memo } from "react"

import { isTodoCompleted, Todo } from "../store/useTodos"

export interface TodoProps {
  todo: Todo
  onRemove: () => void
}

export default memo(function TodoView({ todo, onRemove }: TodoProps) {
  const completed = isTodoCompleted(todo)
  const handleToggleTodo = (e: ChangeEvent<HTMLInputElement>) => {
    todo.status = e.target.checked ? "completed" : "incompleted"
  }

  return (
    <div className={classnames("todo-view", { completed })}>
      <input
        id={todo.id}
        type="checkbox"
        checked={completed}
        onChange={handleToggleTodo}
      />
      <label htmlFor={todo.id}>{todo.text}</label>
      <button type="button" onClick={onRemove}>
        Remove
      </button>
    </div>
  )
})
