import { ArborNode, Collection, isNode, MutationEvent, Record } from "@arborjs/store"
import { watchPaths } from "./watchPaths"

type PropOf<T extends object> = keyof T

export function watchCollectionItemProps<T extends Record>(...props: PropOf<T>[]) {
  return (node: ArborNode<Collection<T>>, event: MutationEvent<Collection<T>>) => {
    if (!isNode(node)) return false
    if (event.mutationPath.targets(node) || event.mutationPath.targets(node.items)) return true

    const paths = props.map((prop) =>
      node.$path
        .child("items")
        .child(":any")
        .child(`#${String(prop)}`)
        .toString()
    )

    return watchPaths(...paths)(node, event)
  }
}
