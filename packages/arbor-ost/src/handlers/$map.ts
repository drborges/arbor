import { OST } from "../ost"
import { $object } from "./$object"
import { Visitors } from "../visitors"
import { GetVisitor } from "../visitors/$map/get"
import { SetVisitor } from "../visitors/$map/set"
import { SizeVisitor } from "../visitors/$map/size"
import { DeleteVisitor } from "../visitors/$map/delete"
import { ClearVisitor } from "../visitors/$map/clear"
import { EntriesVisitor } from "../visitors/$map/entries"
import { ForEachVisitor } from "../visitors/$map/forEach"
import { HasVisitor } from "../visitors/$map/has"
import { KeysVisitor } from "../visitors/$map/keys"
import { ValuesVisitor } from "../visitors/$map/values"
import { IteratorVisitor } from "../visitors/$map/iterator"

const mapVisitors = new Visitors(
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

export class $map<V> extends $object<V[]> {
  constructor(ost: OST) {
    super(ost, mapVisitors)
  }

  static accepts(value: unknown): boolean {
    return value instanceof Map
  }
}
