import { Visitor } from "../../visitor"

export class ValuesVisitor extends Visitor {
  prop = "values"

  visit({ $node }) {
    return function* () {
      for (const child of $node[Symbol.iterator]()) {
        yield child
      }
    }
  }
}
