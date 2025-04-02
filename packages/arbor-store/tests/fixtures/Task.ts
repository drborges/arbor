import { proxiable } from "../../src/decorators"

@proxiable
export class Task {
  constructor(public text: string, public done = false) {}
}
