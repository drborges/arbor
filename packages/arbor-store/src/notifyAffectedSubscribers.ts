import { INode } from "./Arbor"
import { MutationEvent } from "./Subscribers"

export function notifyAffectedSubscribers<T extends object>(
  event: MutationEvent<T>
) {
  const root = event.state.current as INode
  root.$subscribers.notify(event)

  event.mutationPath.props.reduce((parent: INode, prop: string) => {
    const node = parent[prop]
    node.$subscribers.notify(event)
    return node
  }, root)
}
