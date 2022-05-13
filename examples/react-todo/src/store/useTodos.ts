import { v4 as uuid } from "uuid"
import { LocalStorage } from "@arborjs/plugins"
import Arbor, {
  BaseNode,
  Collection,
  useArbor,
  watchChildrenProps
} from "@arborjs/react"

export type Status = "completed" | "incompleted"

export class Todo extends BaseNode<Todo> {
  uuid = uuid()
  text!: string
  status: Status = "incompleted"

  static fromData(data: Partial<Todo>): Todo {
    return Object.assign(new Todo(), data) as Todo
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

export class TodosCollection extends Collection<Todo> {
  onRemove(todo: Todo) {
    this.delete(todo)
  }
}

export const store = new Arbor(new TodosCollection())

const persistence = new LocalStorage<TodosCollection>({
  key: "TodoApp.todos",
  debounceBy: 300,
  deserialize: (todos) => {
    const items = Object.values(todos || {}) as Partial<Todo>[]
    const todoItems = items.map(item => Todo.fromData(item))
    return new TodosCollection(...todoItems)
  },
})

store.use(persistence)

export const add = (text: string) => {
  store.root.add(
    Todo.from<Todo>({
      text,
      status: "incompleted",
    })
  )
}

export default function useTodos() {
  return useArbor(store.root, watchChildrenProps<Todo>("status"))
}
