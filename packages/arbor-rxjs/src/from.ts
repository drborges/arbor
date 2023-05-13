import { Observable } from "rxjs"
import Arbor, {
  ArborError,
  ArborNode,
  isNode,
  MutationEvent,
} from "@arborjs/store"

export function from<T extends object>(
  node: ArborNode<T>
): Observable<MutationEvent>

export function from<T extends object>(
  store: Arbor<T>
): Observable<MutationEvent>

export function from<T extends object>(
  storeOrNode: Arbor<T> | ArborNode<T>
): Observable<MutationEvent> {
  if (!isNode(storeOrNode) && !(storeOrNode instanceof Arbor))
    throw new ArborError(
      "Observable target must be either an Arbor instance or an ArborNode"
    )

  const node = isNode(storeOrNode)
    ? (storeOrNode as ArborNode<T>)
    : storeOrNode.state

  const store = isNode(storeOrNode)
    ? (storeOrNode.$tree as Arbor<T>)
    : storeOrNode

  return new Observable<MutationEvent>((subscriber) =>
    store.subscribeTo(node, (event) => {
      subscriber.next(event)
    })
  )
}
