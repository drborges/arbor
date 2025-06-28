import { Visitor } from "../visitor"

export class IteratorVisitor extends Visitor {
  accepts({ prop }) {
    return prop === Symbol.iterator
  }

  visit({ target, $node }) {
    return function* () {
      for (const [key] of target.entries()) {
        yield [key, $node.get(key)]
      }
    }
  }
}
