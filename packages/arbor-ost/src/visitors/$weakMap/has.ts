import { Visitor } from "../visitor"

export class HasVisitor extends Visitor {
  prop = "has"

  visit({ target }) {
    return (key: object) => {
      return target.has(key)
    }
  }
}
