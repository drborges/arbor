import { Visitor } from "../visitor"

export class HasVisitor extends Visitor {
  prop = "has"

  visit({ target }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (valueOrNode: any) => {
      const value = valueOrNode?.$value || valueOrNode
      return target.has(value)
    }
  }
}
