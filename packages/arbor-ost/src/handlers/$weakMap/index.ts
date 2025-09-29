import { OST } from "../../ost"
import { $object } from "../$object"
import { Visitors } from "../visitors"
import { GetVisitor } from "./visitors/get"
import { SetVisitor } from "./visitors/set"
import { DeleteVisitor } from "./visitors/delete"
import { HasVisitor } from "./visitors/has"

const visitors = new Visitors(
  new GetVisitor(),
  new SetVisitor(),
  new DeleteVisitor(),
  new HasVisitor()
)

export class $weakMap extends $object {
  constructor(ost: OST) {
    super(ost, visitors)
  }

  static accepts(value: unknown): boolean {
    return value instanceof WeakMap
  }
}
