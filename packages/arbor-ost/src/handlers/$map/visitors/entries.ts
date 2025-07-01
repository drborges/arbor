import { Visitor } from "../../visitor"

export class EntriesVisitor extends Visitor {
  prop = "entries"

  visit({ target, $node }) {
    return function* () {
      for (const [key] of target.entries()) {
        yield [key, $node.get(key)]
      }
    }
  }
}
