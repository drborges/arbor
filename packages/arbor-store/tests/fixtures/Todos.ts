import { proxiable } from "../../src/decorators"
import { Collection } from "./Collection"
import { Todo } from "./Todo"

@proxiable
export class Todos extends Collection<Todo> {
  addTodo(text: string) {
    this.push(new Todo(text))
  }

  push(...todos: Todo[]): number {
    todos.forEach((todo) => {
      if (todo.done) {
        throw new Error("Todo is already done")
      }
    })

    return super.push(...todos)
  }
}
