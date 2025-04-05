import { Visitor } from "../visitor"

export class ValueVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$value"
  }

  visit({ target }) {
    return target
  }
}
