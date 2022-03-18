import { v4 as uuid } from "uuid"
import Arbor, { Collection, ArborNode, useArbor } from "@arborjs/react"

export type Status = "completed" | "incompleted"

export class Todo extends ArborNode<Todo> {
  uuid = uuid()
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

  get id() {
    return this.uuid
  }
}

export const store = new Arbor(new Collection<Todo>())

export const add = (text: string) => {
  store.root.add(
    Todo.from({
      text,
      status: "incompleted",
    })
  )
}

export default function useTodos() {
  return useArbor(store)
}
