import { OST } from "../ost"
import { $object } from "./$object"
import { PopVisitor } from "../visitors/$array/pop"
import { PushVisitor } from "../visitors/$array/push"
import { ShiftVisitor } from "../visitors/$array/shift"
import { SpliceVisitor } from "../visitors/$array/splice"
import { UnshiftVisitor } from "../visitors/$array/unshift"
import { ReverseVisitor } from "../visitors/$array/reverse"
import { CopyWithinVisitor } from "../visitors/$array/copyWithin"


export class $array<V> extends $object<V[]> {
  constructor(ost: OST) {
    super(ost, [
      new PushVisitor(ost),
      new PopVisitor(ost),
      new ShiftVisitor(ost),
      new UnshiftVisitor(ost),
      new ReverseVisitor(ost),
      new SpliceVisitor(ost),
      new CopyWithinVisitor(ost),
    ])
  }

  static accepts(value: unknown): boolean {
    return Array.isArray(value)
  }
}
