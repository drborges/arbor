import { Visitor } from "../visitor"

export class HasVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "has"
  }

  visit({ target }) {
    return target.has.bind(target)
  }
}
