import Logger from "@arborjs/plugins/Logger"
import LocalStorage from "@arborjs/plugins/LocalStorage"
import useArbor, { watchChildrenProps, watchCollectionItemProps, watchNode } from "@arborjs/react"
import Arbor, { BaseNode, Collection } from "@arborjs/store"
import { v4 as uuid } from "uuid"
import { store as storeFilter } from "./useTodosFilter"

export type Status = "completed" | "active"

export class Todo extends BaseNode<Todo> {
  uuid = uuid()
  text!: string
  status: Status = "active"

  toggle() {
    this.status = this.completed ? "active" : "completed"
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
  deserialize: (todos: TodosCollection) => {
    const items = Object.values(todos?.items || {}) as Partial<Todo>[]
    const todoItems = items.map((item) => Todo.from(item))
    return new TodosCollection(...todoItems)
  },
})

store.use(new Logger("[Todos]"))
store.use(persistence)

export const add = (text: string) => {
  store.root.push(
    Todo.from<Todo>({
      text,
      status: "active",
    })
  )
}

export default function useTodos() {
  return useArbor(store.root, (target, event) => {
    const isTodoFilterAll = storeFilter.root.value === "all"

    return event.mutationPath.targets(target) ||
      event.mutationPath.targets(target.items) ||
      (!isTodoFilterAll && watchCollectionItemProps<Todo>("status")(target, event))
  })
}
