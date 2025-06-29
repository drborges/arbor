import { Visitor } from "../visitor"

export class IsSupersetOfVisitor extends Visitor {
  prop = "isSupersetOf"

  visit({ target }) {
    return (other: any) => {
      // Extract underlying Set if other is a proxy
      const otherSet = other?.$value || other
      return target.isSupersetOf(otherSet)
    }
  }
}
