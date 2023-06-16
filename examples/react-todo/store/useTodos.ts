import { LocalStorage, Logger } from "@arborjs/plugins"
import {
  Arbor,
  ArborNode,
  ArborProxiable,
  detach,
  useArbor,
} from "@arborjs/react"
import { v4 as uuid } from "uuid"

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

  static add(text: string): ArborNode<Todo> {
    const todo = new Todo({
      text,
      status: "active",
    })

    store.state.set(todo.uuid, todo)

    return store.state.get(todo.uuid)
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

export type Record = {
  uuid: string
}

export class Repository<T extends Record> extends Map<string, T> {
  constructor(...records: T[]) {
    super()

    records.forEach((record) => {
      this.set(record.uuid, record)
    })
  }

  add(record: T) {
    this.set(record.uuid, record)
  }

  map<K>(transform: (record: T) => K) {
    return Array.from(this.values()).map(transform)
  }

  toJSON() {
    return Array.from(this.entries()).reduce((obj, entry) => {
      obj[entry[0]] = entry[1]
      return obj
    }, {})
  }
}

export const store = new Arbor(new Repository<Todo>())

const persistence = new LocalStorage<Repository<Todo>>({
  key: "TodoApp.todos",
  debounceBy: 300,
  deserialize: (data: string) => {
    const parsed: Repository<Todo> = JSON.parse(data)
    const items = Object.values(parsed || {}) as Partial<Todo>[]
    const todoItems = items.map((item) => new Todo(item))
    return new Repository<Todo>(...todoItems)
  },
})

store.use(new Logger("Todos"))
store.use(persistence)

export default function useTodos() {
  return useArbor(store)
}
