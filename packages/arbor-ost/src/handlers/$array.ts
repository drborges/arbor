import { OST } from "../ost"
import { $object } from "./$object"
import { PopVisitor } from "../visitors/$array/pop"
import { PushVisitor } from "../visitors/$array/push"
import { ShiftVisitor } from "../visitors/$array/shift"
import { SpliceVisitor } from "../visitors/$array/splice"
import { UnshiftVisitor } from "../visitors/$array/unshift"
import { ReverseVisitor } from "../visitors/$array/reverse"
import { CopyWithinVisitor } from "../visitors/$array/copyWithin"
import { FillVisitor } from "../visitors/$array/fill"
import { Visitors } from "../visitors"

const arrayVisitors = new Visitors(
  new PushVisitor(),
  new PopVisitor(),
  new ShiftVisitor(),
  new UnshiftVisitor(),
  new ReverseVisitor(),
  new SpliceVisitor(),
  new CopyWithinVisitor(),
  new FillVisitor()
)

export class $array<V> extends $object<V[]> {
  constructor(ost: OST) {
    super(ost, arrayVisitors)
  }

  static accepts(value: unknown): boolean {
    return Array.isArray(value)
  }
}
