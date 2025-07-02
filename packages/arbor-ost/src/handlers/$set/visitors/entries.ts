import { Visitor } from "../../visitor"

export class EntriesVisitor extends Visitor {
  prop = "entries"

  visit({ $node }) {
    return function* () {
      for (const child of $node[Symbol.iterator]()) {
        yield [child, child]
      }
    }
  }
}
