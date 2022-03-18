import { Collection, stitch } from "@arborjs/react"
import { LocalStorage } from "@arborjs/plugins"

import { store as todos, Todo } from "./useTodos"
import { Input, store as form } from "./useNewTodo"
import { store as filter, TodosFilter } from "./useTodosFilter"

export interface State {
  todos: Collection<Todo>
  form: Input
  filter: TodosFilter
}

// Stitches together all of the stores creating an
// aggregated store that we can manage directly
export const store = stitch<State>({
  todos,
  form,
  filter,
})

const persistence = new LocalStorage<State>({
  key: "TodoApp",
  debounceBy: 300,
  deserialize: (data) => {
    const items = Object.values(data?.todos || {}) as Partial<Todo>[]
    const todoItems = items.map(item => Todo.from(item))
    return {
      ...data,
      todos: new Collection(...todoItems),
    }
  }
})

store.use(persistence)
