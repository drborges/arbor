import React, { memo } from "react"
import useArbor, { watchChildrenProps } from "@arborjs/react"

import { store, Todo } from "../store/useTodos"

export default memo(function Summary() {
  const todos = useArbor(store, watchChildrenProps<Todo>("status"))
  const total = todos.length
  const completed = todos.filter(todo => todo.completed).length

  return (
    <div className="summary">
      {completed} of {total} completed
    </div>
  )
})
