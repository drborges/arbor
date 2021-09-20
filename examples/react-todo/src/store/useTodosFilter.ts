import Arbor, { useArbor } from "@arborjs/react"
import { Todo } from "./useTodos"

export type Filter = "all" | "completed" | "incompleted"

export interface TodosFilter {
  value: Filter
}

export const store = new Arbor<TodosFilter>({
  value: "all",
})

export default function useTodosFilter() {
  const currentFilter = useArbor(store)
  const select = (value: Filter) => (currentFilter.value = value)
  const filter = (todos: Todo[]) =>
    currentFilter.value === "all"
      ? todos
      : todos.filter((todo) => todo.status === currentFilter.value)

  return {
    current: currentFilter.value,
    select,
    filter,
  }
}
