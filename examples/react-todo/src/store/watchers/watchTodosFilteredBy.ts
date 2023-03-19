import { watchChildren, Watcher } from "@arborjs/react"
import { Repository } from "@arborjs/store"
import { Todo } from "../useTodos"

export const watchTodosFilteredBy = (): Watcher<Repository<Todo>> => (target, event) => {
  return event.mutationPath.targets(target) || watchChildren<Repository<Todo>>("status")(target, event)
}
