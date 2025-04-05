import { Visitor } from "../visitor"

export class MethodVisitor extends Visitor {
  accepts({ childValue }) {
    return typeof childValue === "function"
  }

  visit({ childValue, $node }) {
    return childValue.bind($node)
  }
}
