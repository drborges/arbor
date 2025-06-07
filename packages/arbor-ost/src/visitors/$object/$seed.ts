import { Visitor } from "../visitor"

export class SeedVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$seed"
  }

  visit({ ost, target }) {
    return ost.seedOf(target)
  }
}
