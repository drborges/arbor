import { v4 as uuid } from "uuid"
import Arbor, { useArbor } from "@arborjs/react"

export type Status = "completed" | "incompleted"

export class Todo {
  id!: string
  text!: string
  status: Status = "incompleted"

  static from(props: Partial<Todo>) {
    return Object.assign(new Todo(), props)
  }

  toggle() {
    this.status = this.completed ? "incompleted" : "completed"
  }

  get completed() {
    return this.status === "completed"
  }
}

export const store = new Arbor<Todo[]>([])

export const add = (text: string) => {
  store.root.push(
    Todo.from({
      id: uuid(),
      text,
      status: "incompleted",
    })
  )
}

export default function useTodos() {
  const todos = useArbor(store)

  return {
    todos,
  }
}
