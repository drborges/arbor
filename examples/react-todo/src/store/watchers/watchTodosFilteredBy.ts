import { watchCollectionItemProps, Watcher } from "@arborjs/react";
import { TodosCollection, Todo } from "../useTodos";

export const watchTodosFilteredBy = (filter: string): Watcher<TodosCollection> => (target, event) => {
  const isTodoFilterAll = filter === "all";

  return event.mutationPath.targets(target) ||
    event.mutationPath.targets(target.items) ||
    (!isTodoFilterAll && watchCollectionItemProps<Todo>("status")(target, event));
};
