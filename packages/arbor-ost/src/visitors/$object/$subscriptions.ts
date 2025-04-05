import { Visitor } from "../visitor"

export class SubscriptionsVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "$subscriptions"
  }

  visit({ target }) {
    return this.ost.subscriptionsOf(target)
  }
}
