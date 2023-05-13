import classnames from "classnames"
import React, { memo, useState } from "react"
import useArbor, { watchNode } from "@arborjs/react"

import { store } from "../store/useTodos"

export interface TodoProps {
  id: string
}

export default memo(function TodoView({ id }: TodoProps) {
  const [editing, setEditing] = useState(false)
  const todo = useArbor(store.state[id], watchNode())

  return (
    <div
      className={classnames("todo-view", { completed: todo.completed })}
      data-testid={`todo-${todo.id}`}
    >
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
          data-testid="edit-input"
        />
      )}
      {!editing && <label htmlFor={todo.id}>{todo.text}</label>}
      <span>Likes: {todo.likes}</span>
      <button
        type="button"
        onClick={() => setEditing(!editing)}
        data-testid="edit-btn"
      >
        Edit
      </button>
      <button type="button" onClick={todo.detach}>
        Delete
      </button>
      <button onClick={todo.like} data-testid={`like-todo-${todo.uuid}`}>
        Like
      </button>
    </div>
  )
})
