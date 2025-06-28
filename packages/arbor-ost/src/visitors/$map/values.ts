import { Visitor } from "../visitor"

export class ValuesVisitor extends Visitor {
  prop = "values"

  visit({ target, $node }) {
    return function* () {
      for (const key of target.keys()) {
        yield $node.get(key)
      }
    }
  }
}
