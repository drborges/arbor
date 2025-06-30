import { Visitor } from "../visitor"

export class DeleteVisitor extends Visitor {
  prop = "delete"

  visit({ ost, target, $node }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (valueOrNode: any) => {
      const value = valueOrNode?.$value || valueOrNode

      if (!target.has(value)) {
        return false
      }

      ost.mutate($node, () => {
        target.delete(value)

        return {
          args: [valueOrNode],
          operation: "delete",
        }
      })

      return true
    }
  }
}
