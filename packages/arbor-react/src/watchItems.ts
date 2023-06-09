import { ArborNode, isArborNode, MutationEvent, path } from "@arborjs/store"
import { PropsOf } from "./watchNode"
import { watchPaths } from "./watchPaths"

export function watchItems<T extends object>(...props: PropsOf<T>[]) {
  return (
    node: ArborNode<Map<unknown, T> | Array<T>>,
    event: MutationEvent<Map<unknown, T> | Array<T>>
  ) => {
    if (!isArborNode(node)) return false
    if (event.mutationPath.targets(node)) return true
    const nodePath = path(node)
    const paths =
      props.length === 0
        ? [nodePath.child(":any").toString()]
        : props.map((prop) =>
            nodePath
              .child(":any")
              .child(`#${String(prop)}`)
              .toString()
          )

    return watchPaths(...paths)(node, event)
  }
}
