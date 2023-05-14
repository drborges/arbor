import { INode } from "./Arbor"
import { MutationEvent } from "./Subscribers"

export function notifyAffectedSubscribers(event: MutationEvent) {
  const root = event.state.current as INode
  root.$subscribers.notify(event)

  event.mutationPath.props.reduce((parent: INode, prop: string) => {
    const node = parent[prop] as INode
    node.$subscribers.notify(event)
    return node
  }, root)
}
