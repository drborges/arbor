import Arbor, { useArbor } from "@arborjs/react"

export interface Input {
  value: string
}

export const store = new Arbor<Input>({
  value: "",
})

export default function useNewTodo() {
  return useArbor(store)
}
