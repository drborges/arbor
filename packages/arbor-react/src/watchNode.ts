import { ArborNode, MutationEvent } from "@arborjs/store"

type PropOf<T extends object> = keyof T

export function watchNode<T extends object>(...props: PropOf<T>[]) {
  return (node: ArborNode<T>, event: MutationEvent) => {
    if (!event.mutationPath.targets(node)) return false
    if (props.length === 0) return true

    const previousNodeValue = event.mutationPath.walk(event.state.previous) as T
    const currentNodeValue = event.mutationPath.walk(event.state.current) as T

    return props.some(
      (prop) => previousNodeValue[prop] !== currentNodeValue[prop]
    )
  }
}
