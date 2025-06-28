import { Visitor } from "../visitor"

export class ForEachVisitor extends Visitor {
  accepts({ prop }) {
    return prop === "forEach"
  }

  visit({ target, $node }) {
    return function (
      cb: (value: unknown, key: unknown, map: unknown) => void,
      thisArg?: unknown
    ) {
      for (const [key] of target.entries()) {
        cb($node.get(key), key, thisArg || $node)
      }
    }
  }
}
