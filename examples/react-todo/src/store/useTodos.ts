import { v4 as uuid } from "uuid"
import { LocalStorage } from "@arborjs/plugins"
import Arbor, { BaseNode, Collection, isNode } from "@arborjs/store"
import useArbor, { watchChildrenProps, watchNode } from "@arborjs/react"
import { store as storeFilter } from "./useTodosFilter"

export type Status = "completed" | "incompleted"

export class Todo extends BaseNode<Todo> {
  uuid = uuid()
  text!: string
  status: Status = "incompleted"

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
    Todo.from<Todo>({
      text,
      status: "incompleted",
    })
  )
}

export default function useTodos() {
  return useArbor(store.root, (target, event) => {
    if (!isNode(target)) return false

    const isTodoFilterAll = storeFilter.root.value === "all"
    const isMutationTargettingNode = !event.mutationPath.is(target.$path)

    if (isTodoFilterAll && isMutationTargettingNode) return false

    return watchChildrenProps<Todo>("status")(target, event)
  })
}
