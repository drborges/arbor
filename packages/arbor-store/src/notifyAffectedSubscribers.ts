import { INode } from "./Arbor"
import { MutationEvent } from "./Subscribers"

export function notifyAffectedSubscribers<T extends object>(
  event: MutationEvent<T>
) {
  const root = event.state as INode
  root.$subscribers.notify(event)

  event.mutationPath.walk(root, (child: INode) => {
    child.$subscribers.notify(event)
  })
}
