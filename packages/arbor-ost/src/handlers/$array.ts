import { OST } from "../ost"
import { $object } from "./$object"
import { PushVisitor } from "../visitors/$array/push"
import { PopVisitor } from "../visitors/$array/pop"
import { ShiftVisitor } from "../visitors/$array/shift"
import { UnshiftVisitor } from "../visitors/$array/unshift"
import { ReverseVisitor } from "../visitors/$array/reverse"
import { SpliceVisitor } from "../visitors/$array/splice"


export class $array<V> extends $object<V[]> {
  constructor(ost: OST) {
    super(ost, [
      new PushVisitor(ost),
      new PopVisitor(ost),
      new ShiftVisitor(ost),
      new UnshiftVisitor(ost),
      new ReverseVisitor(ost),
      new SpliceVisitor(ost),
    ])
  }

  static accepts(value: unknown): boolean {
    return Array.isArray(value)
  }
}
