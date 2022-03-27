import React, { memo } from "react"
import { useArbor } from "@arborjs/react"

import { store } from "../store/useTodos"

export default memo(function Summary() {
  const total = useArbor(store, todos => todos.length)
  const completed = useArbor(
    store,
    todos => todos.filter(todo => todo.completed).length
  )

  return (
    <div className="summary">
      {completed} of {total} completed
    </div>
  )
})
