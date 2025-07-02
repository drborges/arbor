import { Visitor } from "../../visitor"

export class IsDisjointFromVisitor extends Visitor {
  prop = "isDisjointFrom"

  visit({ target }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (other: any) => {
      // Extract underlying Set if other is a proxy
      const otherSet = other?.$value || other
      return target.isDisjointFrom(otherSet)
    }
  }
}
