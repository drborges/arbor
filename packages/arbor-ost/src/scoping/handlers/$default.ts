/* eslint-disable @typescript-eslint/no-explicit-any */
import { Scope } from "../scope"
import { Seed } from "../../seed"
import { Node, Prop } from "../../types"

export function isNode(value: any): value is Node {
  return value?.$seed instanceof Seed
}

export class $default {
  constructor(readonly scope: Scope<Node>) {}

  static accepts(_value: unknown) {
    return true
  }

  get($node: Node, prop: Prop, receiver: unknown) {
    const seed = $node.$seed

    if (prop != null) {
      this.scope.tracked.get(seed).add(prop)
    }

    const child = Reflect.get($node, prop, receiver)

    return isNode(child) ? this.scope.createProxy(child) : child
  }
}
