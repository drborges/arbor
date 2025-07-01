import { OST } from "../../ost"
import { $object } from "./../$object"
import { Visitors } from "../visitors"
import { GetVisitor } from "./visitors/get"
import { SetVisitor } from "./visitors/set"
import { SizeVisitor } from "./visitors/size"
import { DeleteVisitor } from "./visitors/delete"
import { ClearVisitor } from "./visitors/clear"
import { EntriesVisitor } from "./visitors/entries"
import { ForEachVisitor } from "./visitors/forEach"
import { HasVisitor } from "./visitors/has"
import { KeysVisitor } from "./visitors/keys"
import { ValuesVisitor } from "./visitors/values"
import { IteratorVisitor } from "./visitors/iterator"

const visitors = new Visitors(
  new GetVisitor(),
  new SetVisitor(),
  new SizeVisitor(),
  new DeleteVisitor(),
  new ClearVisitor(),
  new EntriesVisitor(),
  new ForEachVisitor(),
  new HasVisitor(),
  new KeysVisitor(),
  new ValuesVisitor(),
  new IteratorVisitor()
)

export class $map extends $object {
  constructor(ost: OST) {
    super(ost, visitors)
  }

  static accepts(value: unknown): boolean {
    return value instanceof Map
  }
}
