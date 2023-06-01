import { ArborNode, isNode, MutationEvent, Repository } from "@arborjs/store"
import { watchPaths } from "./watchPaths"

export type NodeProps<T> = T extends Function
  ? never
  : T extends object
  ? keyof T
  : never

export type ChildrenNodeProps<T> = {
  [K in keyof T]: T extends Array<infer D>
    ? NodeProps<D>
    : T extends Repository<infer D>
    ? NodeProps<D>
    : NodeProps<T[K]>
}[keyof T]

export function watchChildren<T extends object>(
  ...props: ChildrenNodeProps<T>[]
) {
  return (node: ArborNode<T>, event: MutationEvent) => {
    if (!isNode(node)) return false
    if (event.mutationPath.targets(node)) return true

    const paths =
      props.length === 0
        ? [node.$path.child(":any").toString()]
        : props.map((prop) =>
            node.$path
              .child(":any")
              .child(`#${String(prop)}`)
              .toString()
          )

    return watchPaths(...paths)(node as ArborNode<T>, event)
  }
}
