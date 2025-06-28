import { Visitor } from "../visitor"

export class KeysVisitor extends Visitor {
  prop = "keys"

  visit({ target }) {
    return target.keys.bind(target)
  }
}
