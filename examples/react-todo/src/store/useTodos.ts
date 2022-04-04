import { v4 as uuid } from "uuid"
import Arbor, {
  Collection,
  ArborNode,
  useArbor,
  useArborNode,
} from "@arborjs/react"
import { LocalStorage } from "@arborjs/plugins"

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
    const todoItems = items.map((item) => Todo.from(item))
    return new TodosCollection(...todoItems)
  },
})

store.use(persistence)

export const add = (text: string) => {
  store.root.add(
    Todo.from({
      text,
      status: "incompleted",
    })
  )
}

export default function useTodos() {
  return useArborNode(store.root)
}
