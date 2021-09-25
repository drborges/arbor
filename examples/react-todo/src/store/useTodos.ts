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

export const add = ({ text }: TodoData) => {
  store.root.push({
    id: uuid(),
    text,
    status: "incompleted",
  })
}

export default function useTodos() {
  const todos = useArbor(store)

  return {
    todos,
  }
}
