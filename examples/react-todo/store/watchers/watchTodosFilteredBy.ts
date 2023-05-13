import { watchChildren, Watcher } from "@arborjs/react"
import { Repository } from "@arborjs/store"
import { Todo } from "../useTodos"

export const watchTodosFilteredBy =
  (filter: string): Watcher<Repository<Todo>> =>
  (target, event) => {
    const isTodoFilterAll = filter === "all"

    return (
      event.mutationPath.targets(target) ||
      (!isTodoFilterAll &&
        watchChildren<Repository<Todo>>("status")(target, event))
    )
  }
