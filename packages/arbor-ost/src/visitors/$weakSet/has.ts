import { Visitor } from "../visitor"

export class HasVisitor extends Visitor {
  prop = "has"

  visit({ target }) {
    return (value: object) => {
      return target.has(value)
    }
  }
}
