import { Visitor } from "../visitor"
import "../../types"

export class IsSubsetOfVisitor extends Visitor {
  prop = "isSubsetOf"

  visit({ target }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (other: any) => {
      // Extract underlying Set if other is a proxy
      const otherSet = other?.$value || other
      return target.isSubsetOf(otherSet)
    }
  }
}
