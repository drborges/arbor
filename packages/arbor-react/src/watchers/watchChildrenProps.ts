import { ArborNode, isNode, MutationEvent } from "@arborjs/store"
import { watchPaths } from "./watchPaths"

type PropOf<T extends object> = keyof T

export function watchChildrenProps<T extends object>(...props: PropOf<T>[]) {
  return <K extends object>(node: ArborNode<K>) =>
    (event: MutationEvent<K>) => {
      if (!isNode(node)) return false

      const paths = props.map(prop => node.$path.child(":any").child(`#${prop}`).toString())

      return watchPaths(...paths)(node as ArborNode<K>)(event)
    }
}
