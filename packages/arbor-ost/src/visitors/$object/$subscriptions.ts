import { Visitor } from "../visitor"

export class SubscriptionsVisitor extends Visitor {
  prop = "$subscriptions"

  visit({ ost, target }) {
    return ost.subscriptionsOf(target)
  }
}
