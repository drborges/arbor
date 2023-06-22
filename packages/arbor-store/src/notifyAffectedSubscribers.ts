import type { MutationEvent, Node } from "./types"

export function notifyAffectedSubscribers<T extends object>(
  event: MutationEvent<T>
) {
  const root = event.state as Node
  root.$subscribers.notify(event)

  event.mutationPath.walk(root, (child: Node) => {
    child.$subscribers.notify(event)
  })
}
