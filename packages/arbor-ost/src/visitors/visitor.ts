import { OST } from "../ost"
import { Node, Prop, Value } from "../types"

export type VisitParams = {
  target: Value
  prop: Prop
  $node: Node
  childValue: unknown
}

export class Visitor {
  constructor(readonly ost: OST) { }

  accepts(_: VisitParams) {
    return true
  }

  visit({ childValue }: VisitParams) {
    return childValue
  }
}
