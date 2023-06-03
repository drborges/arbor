import { Arbor, ArborError, MutationEvent } from "@arborjs/store"
import { Observable } from "rxjs"

export function from<T extends object = object>(
  store: Arbor<T>
): Observable<MutationEvent<T>> {
  if (!(store instanceof Arbor))
    throw new ArborError("Observable target must be an Arbor store")

  return new Observable<MutationEvent<T>>((subscriber) =>
    store.subscribe((event) => {
      subscriber.next(event)
    })
  )
}
