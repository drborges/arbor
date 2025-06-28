import { Visitor } from "../visitor"

export class KeysVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "keys"
  }

  visit({ target }) {
    return target.keys.bind(target)
  }
}
