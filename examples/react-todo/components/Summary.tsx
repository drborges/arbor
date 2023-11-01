import { useArbor } from "@arborjs/react"
import React, { memo } from "react"

import { store } from "../store/useTodos"

export default memo(function Summary() {
  const todos = useArbor(store)
  const total = todos.length
  const completed = todos.filter(todo => todo.completed).length

  return (
    <div className="summary">
      {completed} of {total} completed
    </div>
  )
})
