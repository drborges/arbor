import { OST } from "../ost"
import { $object } from "./$object"
import { PushVisitor } from "../visitors/$array/push"
import { PopVisitor } from "../visitors/$array/pop"
import { ShiftVisitor } from "../visitors/$array/shift"

export class $array<V> extends $object<V[]> {
  constructor(ost: OST) {
    super(ost, [
      new PushVisitor(ost),
      new PopVisitor(ost),
      new ShiftVisitor(ost),
    ])
  }

  static accepts(value: unknown): boolean {
    return Array.isArray(value)
  }
}
