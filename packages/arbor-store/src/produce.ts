import Arbor, { INode } from "./Arbor"
import { Mutation } from "./mutate"

export default function produce<T extends object>(mutation: Mutation<T>) {
  return (state: T) => {
    if (state == null) {
      return state
    }

    const store = new Arbor(state)
    mutation(store.root as T)
    const newRoot = store.root as INode<T>
    return newRoot.$unwrap()
  }
}
