import Arbor from "@arborjs/store"
import useArbor from "@arborjs/react"
import { Logger, LocalStorage } from "@arborjs/plugins"

export interface Input {
  value: string
}

export const store = new Arbor<Input>({
  value: "",
})

// store.use(new Logger("[NewTodo]"))
store.use(
  new LocalStorage<Input>({
    key: "TodoApp.form",
  })
)

export default function useNewTodo() {
  return useArbor(store)
}
