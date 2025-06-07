import { Visitor } from "../visitor"

export class SubscriptionsVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$subscriptions"
  }

  visit({ ost, target }) {
    return ost.subscriptionsOf(target)
  }
}
