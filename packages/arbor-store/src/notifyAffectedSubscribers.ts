import { INode } from "./Arbor"
import { MutationEvent } from "./Subscribers"

export function notifyAffectedSubscribers<T extends object>(
  event: MutationEvent<T>
) {
  const root = event.store.state as INode
  root.$subscribers.notify(event)

  event.mutationPath.props.reduce((parent: INode, prop: string) => {
    const node = parent[prop] as INode
    node.$subscribers.notify(event)
    return node
  }, root)
}
