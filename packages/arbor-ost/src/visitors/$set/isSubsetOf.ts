import { Visitor } from "../visitor"

export class IsSubsetOfVisitor extends Visitor {
  prop = "isSubsetOf"

  visit({ target }) {
    return (other: any) => {
      // Extract underlying Set if other is a proxy
      const otherSet = other?.$value || other
      return target.isSubsetOf(otherSet)
    }
  }
}
