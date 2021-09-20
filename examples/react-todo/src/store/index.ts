import { stitch } from "@arborjs/react"
import { LocalStorage } from "@arborjs/plugins"

import { store as todos } from "./useTodos"
import { store as form } from "./useNewTodo"
import { store as filter } from "./useTodosFilter"

// Stitches together all of the stores creating an
// aggregated store that we can manage directly
const store = stitch({
  todos,
  form,
  filter,
})

store.use(new LocalStorage({ key: "TodoApp", debounceBy: 300 }))
