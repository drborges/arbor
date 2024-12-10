import { Json, SerializedBy, serializableAs } from "@arborjs/json"
import { LocalStorage, Logger } from "@arborjs/plugins"
import { Arbor, ArborNode, detach, proxiable } from "@arborjs/store"
import { v4 as uuid } from "uuid"

export type Status = "completed" | "active"

@proxiable
@serializableAs("Todo")
export class Todo {
  uuid = uuid()
  likes = 0
  text!: string
  status: Status = "active"

  constructor(data: Partial<Todo>) {
    Object.assign(this, data)
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

@proxiable
@serializableAs("TodoList")
export class TodoList extends Array<Todo> {
  static fromJSON(value: SerializedBy<TodoList>) {
    return new TodoList(...value)
  }

  toJSON() {
    return Array.from(this.values())
  }

  add(text: string): ArborNode<Todo> {
    const todo = new Todo({
      text,
      status: "active",
    })

    this.push(todo)

    return this[-1]
  }
}

const json = new Json()
export const store = new Arbor(new TodoList())

store.use(new Logger("Todos"))
store.use(
  new LocalStorage<TodoList>({
    key: "TodoApp.todos",
    debounceBy: 300,
    deserialize: (data: string) => json.parse(data),
  })
)
