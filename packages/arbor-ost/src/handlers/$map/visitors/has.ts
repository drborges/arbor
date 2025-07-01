import { Visitor } from "../../visitor"

export class HasVisitor extends Visitor {
  prop = "has"

  visit({ target }) {
    return target.has.bind(target)
  }
}
