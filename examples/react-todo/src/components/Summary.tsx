import React from "react"

import useTodos from "../store/useTodos"

export default function Summary() {
  const { todos } = useTodos()
  return (
    <div className="summary">
      <small>{todos.length} todos</small>
    </div>
  )
}
