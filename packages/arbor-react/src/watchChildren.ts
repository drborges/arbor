import { ArborNode, isNode, MutationEvent } from "@arborjs/store"
import { watchPaths } from "./watchPaths"

type ChildPropsOf<T extends object> = T extends Array<infer K>
  ? keyof K
  : keyof T[keyof T]

export function watchChildren<T extends object>(...props: ChildPropsOf<T>[]) {
  return (node: ArborNode<T>, event: MutationEvent) => {
    if (!isNode(node)) return false
    if (event.mutationPath.targets(node)) return true

    const paths = props.length === 0
      ? [node.$path.child(":any").toString()]
      : props.map((prop) => node.$path.child(":any").child(`#${String(prop)}`).toString())

    return watchPaths(...paths)(node as ArborNode<T>, event)
  }
}
