/* eslint-disable @typescript-eslint/no-explicit-any */
import { Scope } from "../scope"
import { Node, Prop } from "../../types"
import { isNode } from "../../"

export class $object {
  constructor(readonly scope: Scope<Node>) {}

  static accepts(_value: unknown) {
    return true
  }

  get($node: Node, prop: Prop, receiver: unknown) {
    if (prop != null) {
      this.scope.tracked.get($node.$seed).add(prop)
    }

    const child = Reflect.get($node, prop, receiver)

    return isNode(child) ? this.scope.createProxy(child) : child
  }
}
