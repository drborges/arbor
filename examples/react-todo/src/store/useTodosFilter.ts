import Arbor, { useArbor } from "@arborjs/react"

import { Todo } from "./useTodos"

export type FilterValue = "all" | "completed" | "incompleted"

export interface TodosFilter {
  value: FilterValue
}

export const store = new Arbor<TodosFilter>({
  value: "all",
})

export const activate = () => (store.root.value = "incompleted")
export const complete = () => (store.root.value = "completed")
export const select = (filter: FilterValue) => (store.root.value = filter)
export const current = () => store.root.value

export default function useTodosFilter() {
  const currentFilter = useArbor(store)
  const filter = (todos: Todo[]) =>
    currentFilter.value === "all"
      ? todos
      : todos.filter((todo) => todo.status === currentFilter.value)

  return {
    current: current(),
    select,
    filter,
  }
}
