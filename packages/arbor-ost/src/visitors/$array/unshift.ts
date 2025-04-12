import { Visitor } from "../visitor"

export class UnshiftVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "unshift"
  }

  visit({ target, $node }) {
    return (...args: unknown[]) => {
      let unshifted: unknown[]

      this.ost.mutate($node, () => {
        unshifted = target.unshift(...args)

        return {
          args: [args],
          operation: "unshift",
        }
      })

      return unshifted
    }
  }
}
