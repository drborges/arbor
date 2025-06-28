import { Visitor } from "../visitor"

export class DeleteVisitor extends Visitor {
  prop = "delete"

  visit({ ost, target, $node }) {
    return (key: unknown) => {
      if (!target.has(key)) {
        return false
      }

      ost.mutate($node, () => {
        target.delete(key)

        return {
          args: [key],
          operation: "delete",
        }
      })

      return true
    }
  }
}
