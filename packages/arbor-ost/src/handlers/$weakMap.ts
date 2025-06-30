import { OST } from "../ost"
import { $object } from "./$object"
import { Visitors } from "../visitors"
import { GetVisitor } from "../visitors/$weakMap/get"
import { SetVisitor } from "../visitors/$weakMap/set"
import { DeleteVisitor } from "../visitors/$weakMap/delete"
import { HasVisitor } from "../visitors/$weakMap/has"

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
