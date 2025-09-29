/* eslint-disable @typescript-eslint/no-explicit-any */
import { Node, Prop } from "../../types"
import { $object } from "./$object"
import { isNode } from "../../"

export class $set extends $object {
  static accepts(value: unknown) {
    return value instanceof Set
  }

  get($node: Node<Set<unknown>>, prop: Prop, receiver: unknown) {
    const scope = this.scope

    if (prop === Symbol.iterator) {
      return function* () {
        for (const child of $node.values()) {
          yield isNode(child) ? scope.createProxy(child) : child
        }
      }
    }

    if (prop === "forEach") {
      return function (
        cb: (value: unknown, value2: unknown, set: Set<unknown>) => void,
        thisArg?: any
      ) {
        $node.forEach((child) => {
          const childNode = isNode(child) ? scope.createProxy(child) : child
          cb(childNode, childNode, $node)
        }, thisArg)
      }
    }

    if (prop === "difference") {
      return (set: Set<unknown>) => {
        const diff = new Set()

        for (const $child of $node) {
          const child = isNode($child) ? $child?.$value : $child
          if (!set.has(child)) {
            const childNode = isNode($child)
              ? scope.createProxy($child)
              : $child
            diff.add(childNode)
          }
        }

        return diff
      }
    }

    if (prop === "intersection") {
      return (set: Set<unknown>) => {
        const diff = new Set()

        for (const $child of $node) {
          const child = isNode($child) ? $child?.$value : $child
          if (set.has(child)) {
            const childNode = isNode($child)
              ? scope.createProxy($child)
              : $child
            diff.add(childNode)
          }
        }

        return diff
      }
    }

    return super.get($node, prop, receiver)
  }
}
