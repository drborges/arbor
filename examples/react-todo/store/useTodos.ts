import { LocalStorage, Logger } from "@arborjs/plugins"
import {
  Arbor,
  ArborProxiable,
  Repository,
  detach,
  useArbor,
} from "@arborjs/react"
import { v4 as uuid } from "uuid"

import { store as storeFilter } from "./useTodosFilter"
import { watchTodosFilteredBy } from "./watchers/watchTodosFilteredBy"

export type Status = "completed" | "active"

export class Todo {
  [ArborProxiable] = true
  uuid = uuid()
  likes = 0
  text!: string
  status: Status = "active"

  constructor(data: Partial<Todo>) {
    Object.assign(this, data)
  }

  static add(text: string) {
    const todo = new Todo({
      text,
      status: "active",
    })

    store.state[todo.uuid] = todo

    return todo
  }

  delete() {
    detach(this)
  }

  toggle() {
    this.status = this.completed ? "active" : "completed"
  }

  like() {
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
    const todoItems = items.map((item) => new Todo(item))
    return new Repository<Todo>(...todoItems)
  },
})

store.use(new Logger("[Todos]"))
store.use(persistence)

export default function useTodos() {
  useArbor(store.state, watchTodosFilteredBy(storeFilter.state.value))
  return store.state
}
