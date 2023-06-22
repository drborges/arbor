import { Node } from "./Arbor"
import { MutationEvent } from "./Subscribers"

export function notifyAffectedSubscribers<T extends object>(
  event: MutationEvent<T>
) {
  const root = event.state as Node
  root.$subscribers.notify(event)

  event.mutationPath.walk(root, (child: Node) => {
    child.$subscribers.notify(event)
  })
}
