import { Visitor } from "../../visitor"

export class UnshiftVisitor extends Visitor {
  prop = "unshift"

  visit({ ost, target, $node }) {
    return (...args: unknown[]) => {
      let unshifted: unknown[]

      ost.mutate($node, () => {
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
