import { ArborNode, MutationEvent } from "@arborjs/store"

export type PropsOf<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K
}[keyof T]

export function watchNode<T extends object>(...props: PropsOf<T>[]) {
  return (node: ArborNode<T>, event: MutationEvent<T>) => {
    if (!event.mutationPath.targets(node)) return false
    if (props.length === 0) return true

    return event.metadata.props.some((prop) =>
      props.includes(prop as PropsOf<T>)
    )
  }
}
