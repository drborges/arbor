import { Visitor } from "../../visitor"

export class ValueVisitor extends Visitor {
  prop = "$value"

  visit({ target }) {
    return target
  }
}
