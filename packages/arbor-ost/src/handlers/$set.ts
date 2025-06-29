import { OST } from "../ost"
import { $object } from "./$object"
import { Visitors } from "../visitors"
import { AddVisitor } from "../visitors/$set/add"
import { ValuesVisitor } from "../visitors/$set/values"
import { SizeVisitor } from "../visitors/$set/size"
import { HasVisitor } from "../visitors/$set/has"
import { DeleteVisitor } from "../visitors/$set/delete"
import { ClearVisitor } from "../visitors/$set/clear"
import { EntriesVisitor } from "../visitors/$set/entries"
import { ForEachVisitor } from "../visitors/$set/forEach"
import { KeysVisitor } from "../visitors/$set/keys"
import { IteratorVisitor } from "../visitors/$set/iterator"
import { DifferenceVisitor } from "../visitors/$set/difference"
import { IntersectionVisitor } from "../visitors/$set/intersection"
import { UnionVisitor } from "../visitors/$set/union"
import { SymmetricDifferenceVisitor } from "../visitors/$set/symmetricDifference"
import { IsDisjointFromVisitor } from "../visitors/$set/isDisjointFrom"
import { IsSubsetOfVisitor } from "../visitors/$set/isSubsetOf"
import { IsSupersetOfVisitor } from "../visitors/$set/isSupersetOf"
import "../types"

const visitors = new Visitors(
  new AddVisitor(),
  new HasVisitor(),
  new SizeVisitor(),
  new ValuesVisitor(),
  new DeleteVisitor(),
  new ClearVisitor(),
  new EntriesVisitor(),
  new ForEachVisitor(),
  new KeysVisitor(),
  new IteratorVisitor(),
  new DifferenceVisitor(),
  new IntersectionVisitor(),
  new UnionVisitor(),
  new SymmetricDifferenceVisitor(),
  new IsDisjointFromVisitor(),
  new IsSubsetOfVisitor(),
  new IsSupersetOfVisitor()
)

export class $set extends $object {
  constructor(ost: OST) {
    super(ost, visitors)
  }

  static accepts(value: unknown): boolean {
    return value instanceof Set
  }
}
