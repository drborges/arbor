import React, { SyntheticEvent } from "react"

import useNewTodo from "../store/useNewTodo"
import useTodos from "../store/useTodos"

export default function NewTodoForm() {
  const { add } = useTodos()
  const { input } = useNewTodo()
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    add({ text: input.value })
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
}
