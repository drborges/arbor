import { Visitor } from "../../visitor"

export class SizeVisitor extends Visitor {
  prop = "size"

  visit({ target }) {
    return target.size
  }
}
