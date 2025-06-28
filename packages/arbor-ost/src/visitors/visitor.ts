import { OST } from "../ost"
import { Node, Prop, Value } from "../types"

export type VisitParams = {
  ost: OST
  $node: Node
  target: Value
  prop: Prop
  childValue: Value
}

export class Visitor {
  prop?: Prop

  accepts(_: VisitParams) {
    return true
  }

  visit({ childValue }: VisitParams): unknown {
    return childValue
  }
}
