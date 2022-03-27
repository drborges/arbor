import { LocalStorage } from "@arborjs/plugins"
import Arbor, { Collection, useArbor } from "@arborjs/react"

import { Todo } from "./useTodos"

export type FilterValue = "all" | "completed" | "incompleted"

export interface TodosFilter {
  value: FilterValue
}

export const store = new Arbor<TodosFilter>({
  value: "all",
})

store.use(new LocalStorage<TodosFilter>({
  key: "TodoApp.filter",
  debounceBy: 300,
}))

export const activate = () => (store.root.value = "incompleted")
export const complete = () => (store.root.value = "completed")
export const select = (filter: FilterValue) => (store.root.value = filter)

export const filterTodos = (todos: Collection<Todo>, filter: FilterValue) =>
  filter === "all"
    ? todos
    : todos.filter((todo) => todo.status === filter)

export default function useTodosFilter() {
  return useArbor(store)
}
