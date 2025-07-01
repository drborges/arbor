import { Visitor } from "../../visitor"

export class SpliceVisitor extends Visitor {
  prop = "splice"

  visit({ ost, target, $node }) {
    return (
      start: number,
      deleteCount: number,
      ...items: unknown[]
    ): unknown[] => {
      let deleted: unknown[]

      ost.mutate($node, () => {
        deleted = target.splice(start, deleteCount, ...items)

        return {
          args: [start, deleteCount, items],
          operation: "splice",
        }
      })

      return deleted
    }
  }
}
