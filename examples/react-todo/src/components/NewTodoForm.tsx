import React, { memo, SyntheticEvent } from "react"

import useNewTodo from "../store/useNewTodo"
import { Todo } from "../store/useTodos"
import { activate, store as filterStore } from "../store/useTodosFilter"

export default memo(function NewTodoForm() {
  const input = useNewTodo()
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    Todo.add(input.value)
    input.value = ""
    if (filterStore.root.value === "completed") activate()
  }

  return (
    <div className="todo-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input.value}
          onChange={(e) => (input.value = e.target.value)}
        />
        <button disabled={input.value === ""}>Add</button>
      </form>
    </div>
  )
})
