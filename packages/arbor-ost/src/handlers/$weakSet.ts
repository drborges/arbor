import { OST } from "../ost"
import { $object } from "./$object"
import { Visitors } from "../visitors"
import { AddVisitor } from "../visitors/$weakSet/add"
import { DeleteVisitor } from "../visitors/$weakSet/delete"
import { HasVisitor } from "../visitors/$weakSet/has"

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
