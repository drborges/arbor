import useArbor from "@arborjs/react"
import Logger from "@arborjs/plugins/Logger"
import LocalStorage from "@arborjs/plugins/LocalStorage"
import Arbor, { Collection } from "@arborjs/store"

import { Todo } from "./useTodos"

export type FilterValue = "all" | "completed" | "active"

export interface TodosFilter {
  value: FilterValue
}

export const store = new Arbor<TodosFilter>({
  value: "all",
})

store.use(new Logger("[TodosFilter]"))
store.use(
  new LocalStorage<TodosFilter>({
    key: "TodoApp.filter",
    debounceBy: 300,
  })
)

export const activate = () => (store.root.value = "active")
export const complete = () => (store.root.value = "completed")
export const select = (filter: FilterValue) => (store.root.value = filter)

export const filterTodos = (todos: Collection<Todo>, filter: FilterValue) =>
  filter === "all" ? todos : todos.filter((todo) => todo.status === filter)

export default function useTodosFilter() {
  return useArbor(store)
}
