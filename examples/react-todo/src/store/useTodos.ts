import { v4 as uuid } from "uuid"
import Arbor, { useArbor } from "@arborjs/react"

export interface Todo {
  id: string
  text: string
  status: "completed" | "incompleted"
}

export interface TodoData {
  text: string
}

export const store = new Arbor<Todo[]>([])

export const isTodoCompleted = (todo: Todo) => todo.status === "completed"

export default function useTodos() {
  const todos = useArbor(store)
  const add = ({ text }: TodoData) => {
    todos.push({
      id: uuid(),
      text,
      status: "incompleted",
    })
  }

  return {
    add,
    todos,
  }
}
