import { v4 as uuid } from "uuid"
import Logger from "@arborjs/plugins/Logger"
import LocalStorage from "@arborjs/plugins/LocalStorage"
import Arbor, { BaseNode, Repository } from "@arborjs/store"
import useArbor from "@arborjs/react"

import { store as storeFilter } from "./useTodosFilter"
import { watchTodosFilteredBy } from "./watchers/watchTodosFilteredBy"

export type Status = "completed" | "active"

export class Todo extends BaseNode<Todo> {
  uuid = uuid()
  likes = 0
  text!: string
  status: Status = "active"

  static add(text: string) {
    const todo = Todo.from<Todo>({
      text,
      status: "active",
    })

    store.state[todo.uuid] = todo

    return todo
  }

  toggle() {
    this.status = this.completed ? "active" : "completed"
  }

  like() {
    this.likes++
    this.likes++
    this.likes++
  }

  get completed() {
    return this.status === "completed"
  }

  get id() {
    return this.uuid
  }
}

export const store = new Arbor(new Repository<Todo>())

const persistence = new LocalStorage<Repository<Todo>>({
  key: "TodoApp.todos",
  debounceBy: 300,
  deserialize: (todos: Repository<Todo>) => {
    const items = Object.values(todos || {}) as Partial<Todo>[]
    const todoItems = items.map((item) => Todo.from(item))
    return new Repository<Todo>(...todoItems)
  },
})

store.use(new Logger("[Todos]"))
store.use(persistence)

export default function useTodos() {
  return useArbor(store.state, watchTodosFilteredBy(storeFilter.state.value))
}
