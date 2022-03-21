import { LocalStorage } from "@arborjs/plugins"
import Arbor, { useArbor } from "@arborjs/react"

export interface Input {
  value: string
}

export const store = new Arbor<Input>({
  value: "",
})

store.use(new LocalStorage<Input>({
  key: "TodoApp.form",
}))

export default function useNewTodo() {
  return useArbor(store)
}
