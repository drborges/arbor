import { ArborNode, isNode, MutationEvent } from "@arborjs/store";

type PropOf<T extends object> = keyof T

export function watchNodeProps<T extends object>(...props: PropOf<T>[]) {
  return (node: ArborNode<T>, event: MutationEvent<T>) => {
      if (!isNode(node)) return false
      if (!event.mutationPath.is(node.$path)) return false

      const previousNodeValue = event.mutationPath.walk(event.state.previous) as T
      const currentNodeValue = event.mutationPath.walk(event.state.current) as T

      return props.some(prop => previousNodeValue[prop] !== currentNodeValue[prop])
    }
}
