import { ArborNode, isNode, MutationEvent } from "@arborjs/store"
import { watchPaths } from "./watchPaths"

type ChildPropsOf<T extends object> = T extends Array<infer K>
  ? keyof K
  : keyof T[keyof T]

export function watchChild<T extends object>(childKey: keyof T, ...props: ChildPropsOf<T>[]) {
  return (node: ArborNode<T>, event: MutationEvent) => {
    if (!isNode(node)) return false
    const childPath = node.$path.child(String(childKey))
    const potentialChildPath = event.mutationPath.child(event.metadata.props[0])
    if (potentialChildPath.targets(childPath)) return true

    const paths = props.length === 0
      ? [childPath.toString()]
      : props.map((prop) => childPath.child(`#${String(prop)}`).toString())

    return watchPaths(...paths)(node as ArborNode<T>, event)
  }
}
