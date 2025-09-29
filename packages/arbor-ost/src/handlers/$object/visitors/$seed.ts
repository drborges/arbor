import { Visitor } from "../../visitor"

export class SeedVisitor extends Visitor {
  prop = "$seed"

  visit({ ost, target }) {
    return ost.seedOf(target)
  }
}
