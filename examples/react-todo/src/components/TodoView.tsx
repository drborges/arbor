import classnames from "classnames"
import React, { memo, useState } from "react"

import { Todo } from "../store/useTodos"

export interface TodoProps {
  todo: Todo
  onRemove: () => void
}

export default memo(function TodoView({ todo, onRemove }: TodoProps) {
  const [editing, setEditing] = useState(false)

  return (
    <div className={classnames("todo-view", { completed: todo.completed })}>
      <input
        id={todo.id}
        type="checkbox"
        checked={todo.completed}
        onChange={todo.toggle}
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
      <button
        className="edit-btn"
        type="button"
        onClick={() => setEditing(!editing)}
      >
        ✏️
      </button>
      <button type="button" onClick={onRemove}>
        ❌
      </button>
    </div>
  )
})
