/* eslint-disable @typescript-eslint/no-explicit-any */
import { Node, Prop } from "../../types"
import { Scope } from "../scope"
import { isNode } from "./$default"

export class $set {
  constructor(readonly scope: Scope<Node>) {}

  static accepts(value: unknown) {
    return value instanceof Set
  }

  get($node: Node<Set<unknown>>, prop: Prop, receiver: unknown) {
    const seed = $node.$seed
    const scope = this.scope

    if (prop != null) {
      this.scope.tracked.get(seed).add(prop)
    }

    if (prop === "has") {
      return (value: any) => {
        return $node.has(value) || $node.has(value?.$value)
      }
    }

    if (prop === Symbol.iterator) {
      return function*() {
        for (const child of $node.values()) {
          yield isNode(child) ? scope.createProxy(child) : child
        }
      }
    }

    if (prop === "forEach") {
      return function(cb: (value: unknown, value2: unknown, set: Set<unknown>) => void, thisArg?: any) {
        $node.forEach((child) => {
          const childNode = isNode(child) ? scope.createProxy(child) : child
          cb(childNode, childNode, $node)
        }, thisArg)
      }
    }

    const child = Reflect.get($node, prop, receiver)

    return isNode(child) ? scope.createProxy(child) : child
  }
}
