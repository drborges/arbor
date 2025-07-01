import { Prop } from "../types"
import { ChildrenVisitor } from "./$object/visitors/$children"
import { CreateChildVisitor } from "./$object/visitors/$createChild"
import { ParentVisitor } from "./$object/visitors/$parent"
import { PathVisitor } from "./$object/visitors/$path"
import { ProxiableVisitor } from "./$object/visitors/proxiable"
import { SeedVisitor } from "./$object/visitors/$seed"
import { SubscriptionsVisitor } from "./$object/visitors/$subscriptions"
import { ValueVisitor } from "./$object/visitors/$value"
import { DetachedVisitor } from "./$object/visitors/detached"
import { GetterVisitor } from "./$object/visitors/getter"
import { ToStringTagVisitor } from "./$object/visitors/toStringTag"
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
