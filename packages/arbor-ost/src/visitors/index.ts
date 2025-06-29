import { Prop } from "../types"
import { ChildrenVisitor } from "./$object/$children"
import { CreateChildVisitor } from "./$object/$createChild"
import { ParentVisitor } from "./$object/$parent"
import { PathVisitor } from "./$object/$path"
import { ProxiableVisitor } from "./$object/proxiable"
import { SeedVisitor } from "./$object/$seed"
import { SubscriptionsVisitor } from "./$object/$subscriptions"
import { ValueVisitor } from "./$object/$value"
import { DetachedVisitor } from "./$object/detached"
import { GetterVisitor } from "./$object/getter"
import { ToStringTagVisitor } from "./$object/toStringTag"
import { VisitParams, Visitor } from "./visitor"

const defaultVisitors = [
  new SeedVisitor(),
  new PathVisitor(),
  new CreateChildVisitor(),
  new SubscriptionsVisitor(),
  new ValueVisitor(),
  new ChildrenVisitor(),
  new ParentVisitor(),
  new DetachedVisitor(),
  new GetterVisitor(),
  new ProxiableVisitor(),
  new ToStringTagVisitor(),
  new Visitor(),
]

export class Visitors {
  propVisitors = new Map<Prop, Visitor>()
  predicateVisitors: Visitor[] = []

  constructor(...visitors: Visitor[]) {
    visitors.concat(defaultVisitors).forEach((v) => {
      if (v.prop != null) {
        this.propVisitors.set(v.prop, v)
      } else {
        this.predicateVisitors.push(v)
      }
    })
  }

  visit(params: VisitParams) {
    const propVisitor = this.propVisitors.get(params.prop)

    if (propVisitor) {
      return propVisitor.visit(params)
    }

    const predicateVisitor = this.predicateVisitors.find((v) =>
      v.accepts(params)
    )

    return predicateVisitor?.visit(params)
  }
}
