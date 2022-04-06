import Arbor, { Node } from "./Arbor"
import { Mutation } from "./mutate"

export default function produce<T extends object>(mutation: Mutation<Node<T>>) {
  return (state: T) => {
    if (state == null) {
      return state
    }

    const store = new Arbor(state)
    mutation(store.root)
    return store.root.$unwrap()
  }
}
