import React, { memo, SyntheticEvent } from "react"

import { add } from "../store/useTodos"
import useNewTodo from "../store/useNewTodo"

export default memo(function NewTodoForm() {
  const input = useNewTodo()
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    add(input.value)
    input.value = ""
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
