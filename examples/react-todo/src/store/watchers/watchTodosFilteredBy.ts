import { watchChildrenProps, Watcher } from "@arborjs/react";
import { Repository } from "@arborjs/store";
import { Todo } from "../useTodos";

export const watchTodosFilteredBy = (filter: string): Watcher<Repository<Todo>> => (target, event) => {
  const isTodoFilterAll = filter === "all";

  return event.mutationPath.targets(target) ||
    (!isTodoFilterAll && watchChildrenProps<Todo>("status")(target, event));
};
