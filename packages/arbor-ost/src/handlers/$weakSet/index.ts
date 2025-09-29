import { OST } from "../../ost"
import { $object } from "../$object"
import { Visitors } from "../visitors"
import { AddVisitor } from "./visitors/add"
import { DeleteVisitor } from "./visitors/delete"
import { HasVisitor } from "./visitors/has"

const visitors = new Visitors(
  new AddVisitor(),
  new DeleteVisitor(),
  new HasVisitor()
)

export class $weakSet extends $object {
  constructor(ost: OST) {
    super(ost, visitors)
  }

  static accepts(value: unknown): boolean {
    return value instanceof WeakSet
  }
}
