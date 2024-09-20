import { LocalStorage, Logger } from "@arborjs/plugins"
import { useArbor } from "@arborjs/react"
import { Arbor } from "@arborjs/store"

import { TodoList } from "./useTodos"

export type FilterValue = "all" | "completed" | "active"

export interface TodosFilter {
  value: FilterValue
}

export const store = new Arbor<TodosFilter>({
  value: "all",
})

store.use(new Logger("TodosFilter"))
store.use(
  new LocalStorage<TodosFilter>({
    key: "TodoApp.filter",
    debounceBy: 300,
  })
)

export const activate = () => (store.state.value = "active")
export const complete = () => (store.state.value = "completed")
export const select = (filter: FilterValue) => (store.state.value = filter)

export const filterTodos = (todos: TodoList, filter: FilterValue) => {
  return filter === "all"
    ? todos
    : todos.filter((todo) => todo.status === filter)
}

export default function useTodosFilter() {
  return useArbor(store)
}
