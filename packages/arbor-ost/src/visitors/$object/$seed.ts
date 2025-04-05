import { Visitor } from "../visitor"

export class SeedVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$seed"
  }

  visit({ target }) {
    return this.ost.seedOf(target)
  }
}
