import { OST } from "../../ost"
import { $object } from "../$object"
import { Visitors } from "../visitors"
import { AddVisitor } from "./visitors/add"
import { ValuesVisitor } from "./visitors/values"
import { SizeVisitor } from "./visitors/size"
import { HasVisitor } from "./visitors/has"
import { DeleteVisitor } from "./visitors/delete"
import { ClearVisitor } from "./visitors/clear"
import { EntriesVisitor } from "./visitors/entries"
import { ForEachVisitor } from "./visitors/forEach"
import { KeysVisitor } from "./visitors/keys"
import { IteratorVisitor } from "./visitors/iterator"
import { DifferenceVisitor } from "./visitors/difference"
import { IntersectionVisitor } from "./visitors/intersection"
import { UnionVisitor } from "./visitors/union"
import { SymmetricDifferenceVisitor } from "./visitors/symmetricDifference"
import { IsDisjointFromVisitor } from "./visitors/isDisjointFrom"
import { IsSubsetOfVisitor } from "./visitors/isSubsetOf"
import { IsSupersetOfVisitor } from "./visitors/isSupersetOf"
import { ChildrenVisitor } from "./visitors/$children"

const visitors = new Visitors(
  new ChildrenVisitor(),
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
