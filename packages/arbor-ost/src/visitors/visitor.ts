import { OST } from "../ost"
import { Node, Prop, Value } from "../types"

export type VisitParams = {
  ost: OST
  $node: Node
  target: Value
  prop: Prop
}

export class Visitor {
  accepts(_: VisitParams) {
    return true
  }

  visit({ target, prop, $node }: VisitParams) {
    return Reflect.get(target, prop, $node)
  }
}
