import { ArborNode, isArborNode, MutationEvent, path } from "@arborjs/store"
import { watchPaths } from "./watchPaths"

export type NodeProps<T> = T extends Function
  ? never
  : T extends object
  ? keyof T
  : never

export type ChildrenNodeProps<T> = {
  [K in keyof T]: T extends Array<infer D> ? NodeProps<D> : NodeProps<T[K]>
}[keyof T]

export function watchChildren<T extends object>(
  ...props: ChildrenNodeProps<T>[]
) {
  return (node: ArborNode<T>, event: MutationEvent<T>) => {
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

    return watchPaths(...paths)(node as ArborNode<T>, event)
  }
}
