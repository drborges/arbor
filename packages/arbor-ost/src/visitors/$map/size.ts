import { Visitor } from "../visitor"

export class SizeVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "size"
  }

  visit({ target }) {
    return target.size
  }
}
