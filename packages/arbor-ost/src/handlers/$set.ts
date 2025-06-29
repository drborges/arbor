import { OST } from "../ost"
import { $object } from "./$object"
import { Visitors } from "../visitors"
import { AddVisitor } from "../visitors/$set/add"
import { ValuesVisitor } from "../visitors/$set/values"
import { SizeVisitor } from "../visitors/$set/size"
import { HasVisitor } from "../visitors/$set/has"

const visitors = new Visitors(
  new AddVisitor(),
  new HasVisitor(),
  new SizeVisitor(),
  new ValuesVisitor()
)

export class $set extends $object {
  constructor(ost: OST) {
    super(ost, visitors)
  }

  static accepts(value: unknown): boolean {
    return value instanceof Set
  }
}
