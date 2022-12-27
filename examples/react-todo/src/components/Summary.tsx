import React, { memo } from "react"
import useArbor, { watchChildren } from "@arborjs/react"

import { store, Todo } from "../store/useTodos"

export default memo(function Summary() {
  const repo = useArbor(store, watchChildren<Todo>("status"))
  const todos = Object.values(repo)
  const total = todos.length
  const completed = todos.filter(todo => todo.completed).length

  return (
    <div className="summary">
      {completed} of {total} completed
    </div>
  )
})
