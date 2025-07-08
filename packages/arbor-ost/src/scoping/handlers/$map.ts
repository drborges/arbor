import { Node, Prop } from "../../types"
import { Scope } from "../scope"
import { isNode } from "./$default"

export class $map {
  constructor(readonly scope: Scope<Node>) {}

  static accepts(value: unknown) {
    return value instanceof Map
  }

  get($node: Node<Map<unknown, unknown>>, prop: Prop, receiver: unknown) {
    const seed = $node.$seed
    const scope = this.scope

    if (prop != null) {
      this.scope.tracked.get(seed).add(prop)
    }

    if (prop === "get") {
      return (key: unknown) => {
        const child = $node.get(key)
        return isNode(child) ? scope.createProxy(child) : child
      }
    }

    if (prop === Symbol.iterator) {
      return function*() {
        for (const child of $node.values()) {
          yield isNode(child) ? scope.createProxy(child) : child
        }
      }
    }

    const child = Reflect.get($node, prop, receiver)

    return isNode(child) ? scope.createProxy(child) : child
  }
}
