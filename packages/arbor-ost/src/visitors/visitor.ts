import { OST } from "../ost"
import { Node, Prop, Value } from "../types"

export type VisitParams = {
  ost: OST
  $node: Node
  target: Value
  prop: Prop
  childValue: unknown
}

export class Visitor {
  accepts(_: VisitParams) {
    return true
  }

  visit({ childValue }: VisitParams) {
    return childValue
  }
}
