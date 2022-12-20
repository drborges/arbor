import classnames from "classnames"
import React, { memo, useState } from "react"
import useArbor, { watchNode } from "@arborjs/react"

import { store } from "../store/useTodos"

export interface TodoProps {
  id: string
}

export default memo(function TodoView({ id }: TodoProps) {
  const [editing, setEditing] = useState(false)
  const todo = useArbor(store.root[id], watchNode())

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
      <span>Likes: {todo.likes}</span>
      <button
        className="edit-btn"
        type="button"
        onClick={() => setEditing(!editing)}
      >
        ✏️
      </button>
      <button type="button" onClick={todo.detach}>
        ❌
      </button>
      <button onClick={todo.like}>👍🏼</button>
    </div>
  )
})
