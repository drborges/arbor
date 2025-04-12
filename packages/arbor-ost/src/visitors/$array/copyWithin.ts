import { Visitor } from "../visitor"

export class CopyWithinVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "copyWithin"
  }

  visit({ target, $node }) {
    return (...args: unknown[]) => {
      return this.ost.mutate($node, () => {
        target.copyWithin(...args)

        return {
          args: args,
          operation: "copyWithin",
        }
      })
    }
  }
}
