import { proxiable } from "../../src/decorators"

@proxiable
export class Todo {
  constructor(public text: string, public done = false) {}
}
