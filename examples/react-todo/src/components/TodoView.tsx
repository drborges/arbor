import classnames from "classnames"
import React, { ChangeEvent, memo, useRef, useState } from "react"

import { isTodoCompleted, Todo } from "../store/useTodos"

export interface TodoProps {
  todo: Todo
  onRemove: () => void
}

export default memo(function TodoView({ todo, onRemove }: TodoProps) {
  const editInputRef = useRef<HTMLInputElement>()
  const [editing, setEditing] = useState(false)
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
      {editing && (
        <input
          autoFocus
          type="text"
          value={todo.text}
          onBlur={() => setEditing(false)}
          onChange={(e) => (todo.text = e.target.value)}
        />
      )}
      {!editing && <label htmlFor={todo.id}>{todo.text}</label>}
      <button type="button" onClick={() => setEditing(!editing)}>
        ✏️
      </button>
      <button type="button" onClick={onRemove}>
        ⤫
      </button>
    </div>
  )
})
