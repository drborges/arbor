import { ArborNode, isNode, MutationEvent } from "@arborjs/store"
import { watchPaths } from "./watchPaths"

type PropOf<T extends object> = keyof T

export function watchChildren<T extends object>(...props: PropOf<T>[]) {
  return <K extends object>(node: ArborNode<K>, event: MutationEvent) => {
    if (!isNode(node)) return false
    if (event.mutationPath.targets(node)) return true

    const paths = props.map((prop) =>
      node.$path
        .child(":any")
        .child(`#${String(prop)}`)
        .toString()
    )

    return watchPaths(...paths)(node as ArborNode<K>, event)
  }
}
