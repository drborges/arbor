import { Visitor } from "../visitor"

export class FillVisitor extends Visitor {
  prop = "fill"

  visit({ ost, target, $node }) {
    return (...args: unknown[]) => {
      return ost.mutate($node, () => {
        target.fill(...args)

        return {
          args: args,
          operation: "fill",
        }
      })
    }
  }
}
