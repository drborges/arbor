import { proxiable } from "../../src/decorators"
import { Collection } from "./Collection"
import { Task } from "./Task"

@proxiable
export class Tasks extends Collection<Task> {
  addTask(text: string) {
    this.push(new Task(text))
  }
}
