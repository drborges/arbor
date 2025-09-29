import { Node, Prop } from "../../types"
import { $object } from "./$object"
import { isNode } from "../../"

export class $map extends $object {
  static accepts(value: unknown) {
    return value instanceof Map
  }

  get($node: Node<Map<unknown, unknown>>, prop: Prop, receiver: unknown) {
    const scope = this.scope

    if (prop === Symbol.iterator) {
      return function* () {
        for (const [key, child] of $node.entries()) {
          const value = isNode(child) ? scope.createProxy(child) : child
          yield [key, value]
        }
      }
    }

    if (prop === "get") {
      return (key: unknown) => {
        const child = $node.get(key)
        return isNode(child) ? scope.createProxy(child) : child
      }
    }

    return super.get($node, prop, receiver)
  }
}
