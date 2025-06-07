import { ChildrenVisitor } from "./$object/$children"
import { CreateChildVisitor } from "./$object/$createChild"
import { ParentVisitor } from "./$object/$parent"
import { PathVisitor } from "./$object/$path"
import { ProxiableVisitor } from "./$object/$proxiable"
import { SeedVisitor } from "./$object/$seed"
import { SubscriptionsVisitor } from "./$object/$subscriptions"
import { ValueVisitor } from "./$object/$value"
import { DetachedVisitor } from "./$object/detached"
import { GetterVisitor } from "./$object/getter"
import { ToStringTagVisitor } from "./$object/toStringTag"
import { VisitParams, Visitor } from "./visitor"

const defaultVisitor = new Visitor()
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
]

export class Visitors extends Array<Visitor> {
  constructor(...visitors: Visitor[]) {
    super(...defaultVisitors, ...visitors, defaultVisitor)
  }

  visit(params: VisitParams) {
    return this.find((v) => v.accepts(params))?.visit(params)
  }
}
