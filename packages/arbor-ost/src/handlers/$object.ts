import { OST } from "../ost"
import { Visitors } from "../visitors"
import { $delete, $set } from "./mutations"
import { Node, Prop, Value } from "../types"

import { Visitor } from "../visitors/visitor"
import { SeedVisitor } from "../visitors/$object/$seed"
import { PathVisitor } from "../visitors/$object/$path"
import { ValueVisitor } from "../visitors/$object/$value"
import { GetterVisitor } from "../visitors/$object/getter"
import { ParentVisitor } from "../visitors/$object/$parent"
import { ChildrenVisitor } from "../visitors/$object/$children"
import { ProxiableVisitor } from "../visitors/$object/$proxiable"
import { ToStringTagVisitor } from "../visitors/$object/toStringTag"
import { CreateChildVisitor } from "../visitors/$object/$createChild"
import { SubscriptionsVisitor } from "../visitors/$object/$subscriptions"
import { DetachedVisitor, isDetachedProperty } from "../visitors/$object/detached"

function createDefaultVisitors(ost: OST, extra: Visitor[]) {
  return new Visitors(
    new SeedVisitor(ost),
    new PathVisitor(ost),
    new ValueVisitor(ost),
    new ParentVisitor(ost),
    new ChildrenVisitor(ost),
    new CreateChildVisitor(ost),
    new SubscriptionsVisitor(ost),
    new DetachedVisitor(ost),
    new GetterVisitor(ost),
    new ProxiableVisitor(ost),
    ...extra,
    // Any visitor below this point can be overriden by subclasses via the extra visitors provided
    new ToStringTagVisitor(ost),
    new Visitor(ost),
  )
}

export class $object<V extends Value = Value> implements ProxyHandler<V> {
  #visitors: Visitors

  constructor(readonly $ost: OST, visitors: Visitor[] = []) {
    this.#visitors = createDefaultVisitors($ost, visitors)
  }

  static accepts(_value: unknown) {
    return true
  }

  get(target: V, prop: Prop, $node: Node<V>) {
    const childValue = Reflect.get(target, prop, $node)
    return this.#visitors.visit({ target, prop, $node, childValue })
  }

  set(target: V, prop: Prop, newValue: unknown, $node: Node<V>): boolean {
    if (isDetachedProperty(target, prop)) {
      return Reflect.set(target, prop, newValue, $node)
    }

    this.$ost.mutate($node, $set(prop as keyof V, newValue))

    return true
  }

  deleteProperty(target: V, prop: Prop): boolean {
    if (isDetachedProperty(target, prop)) {
      return Reflect.deleteProperty(target, prop)
    }

    const $node = this.$ost.nodeOf(target)
    this.$ost.mutate($node, $delete(prop as keyof V))

    return true
  }
}
