import { OST } from "../../ost"
import { $object } from "./../$object"
import { PopVisitor } from "./visitors/pop"
import { PushVisitor } from "./visitors/push"
import { ShiftVisitor } from "./visitors/shift"
import { SpliceVisitor } from "./visitors/splice"
import { UnshiftVisitor } from "./visitors/unshift"
import { ReverseVisitor } from "./visitors/reverse"
import { CopyWithinVisitor } from "./visitors/copyWithin"
import { FillVisitor } from "./visitors/fill"
import { Visitors } from "../visitors"

const visitors = new Visitors(
  new PushVisitor(),
  new PopVisitor(),
  new ShiftVisitor(),
  new UnshiftVisitor(),
  new ReverseVisitor(),
  new SpliceVisitor(),
  new CopyWithinVisitor(),
  new FillVisitor()
)

export class $array extends $object {
  constructor(ost: OST) {
    super(ost, visitors)
  }

  static accepts(value: unknown): boolean {
    return Array.isArray(value)
  }
}
